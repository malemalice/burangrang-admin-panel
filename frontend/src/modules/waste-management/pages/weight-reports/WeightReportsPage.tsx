import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { usePDF } from 'react-to-pdf';
import { format } from 'date-fns';
import { Plus, MoreHorizontal, Pencil, Trash2, Eye, Printer } from 'lucide-react';
import { buildPdfOptions } from '@/core/lib/pdfExport';
import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import DataTable from '@/core/components/ui/data-table/DataTable';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import approvalService, { type ApprovalStatusHistory } from '@/modules/master-data/services/approvalService';
import { APPROVAL_ENTITIES } from '@/shared/constants/approval-entity.constants';
import { weightReportService, wasteSourceService, storageLocationService } from '../../services/wasteManagementService';
import { WeightReport, WeightReportStatusEnum, PaginatedResponse } from '../../types/waste-management.types';
import { WeightReportPDFTemplate } from '../../components/WeightReportPDFTemplate';

function getStatusBadge(status?: string) {
  switch (status) {
    case WeightReportStatusEnum.DRAFT:
      return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">Draft</Badge>;
    case WeightReportStatusEnum.OPEN:
      return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">Open</Badge>;
    case WeightReportStatusEnum.WAITING_APPROVAL:
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Waiting Approval</Badge>;
    case WeightReportStatusEnum.DONE:
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Done</Badge>;
    case WeightReportStatusEnum.REJECTED:
      return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Rejected</Badge>;
    default:
      return status ? <Badge variant="outline">{status}</Badge> : null;
  }
}

export default function WeightReportsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<WeightReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [exportQueue, setExportQueue] = useState<WeightReport[]>([]);
  const [exportIndex, setExportIndex] = useState(0);
  const [isExportingAllPDF, setIsExportingAllPDF] = useState(false);
  const [pdfApprovalForExport, setPdfApprovalForExport] = useState<ApprovalStatusHistory | null>(null);
  const [singlePdfContext, setSinglePdfContext] = useState<{
    report: WeightReport;
    approval: ApprovalStatusHistory | null;
  } | null>(null);
  const [isExportingRowPdf, setIsExportingRowPdf] = useState(false);
  const exportCancelledRef = useRef(false);

  const [sources, setSources] = useState<{ id: string; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);

  const page = useMemo(() => {
    const raw = searchParams.get('page');
    const p = raw ? Number(raw) : 1;
    return !Number.isFinite(p) || p <= 0 ? 1 : Math.floor(p);
  }, [searchParams]);

  const limit = useMemo(() => {
    const raw = searchParams.get('limit');
    const parsed = raw ? Number(raw) : 10;
    return !Number.isFinite(parsed) || parsed <= 0 ? 10 : Math.floor(parsed);
  }, [searchParams]);

  const search = useMemo(() => searchParams.get('search') ?? '', [searchParams]);

  const activeFilters = useMemo(() => {
    const filters: Record<string, { value: any; label: string }> = {};
    const sourceId = searchParams.get('sourceId');
    if (sourceId) {
      const src = sources.find((s) => s.id === sourceId);
      filters.sourceId = { value: sourceId, label: src?.name ?? sourceId };
    }
    const storageLocationId = searchParams.get('storageLocationId');
    if (storageLocationId) {
      const loc = locations.find((l) => l.id === storageLocationId);
      filters.storageLocationId = { value: storageLocationId, label: loc?.name ?? storageLocationId };
    }
    const status = searchParams.get('status');
    if (status) {
      const statusLabels: Record<string, string> = {
        [WeightReportStatusEnum.DRAFT]: 'Draft',
        [WeightReportStatusEnum.OPEN]: 'Open',
        [WeightReportStatusEnum.WAITING_APPROVAL]: 'Waiting Approval',
        [WeightReportStatusEnum.DONE]: 'Done',
        [WeightReportStatusEnum.REJECTED]: 'Rejected',
      };
      filters.status = { value: status, label: statusLabels[status] ?? status };
    }
    return filters;
  }, [searchParams, sources, locations]);

  const currentReportForPDF = useMemo(
    () =>
      isExportingAllPDF && exportQueue.length > 0 && exportIndex < exportQueue.length
        ? exportQueue[exportIndex]
        : null,
    [isExportingAllPDF, exportQueue, exportIndex],
  );

  const activePdfReport = singlePdfContext?.report ?? currentReportForPDF;
  const activePdfApproval = singlePdfContext?.approval ?? pdfApprovalForExport;

  const pdfFilename = activePdfReport
    ? `${activePdfReport.reportCode}-${format(new Date(), 'yyyyMMdd-HHmmss')}${
        isExportingAllPDF && exportQueue.length > 1 ? `-${exportIndex + 1}` : ''
      }.pdf`
    : 'weight-report.pdf';
  const { toPDF, targetRef } = usePDF(
    buildPdfOptions({
      filename: pdfFilename,
    }),
  );

  const updateSearchParams = useCallback(
    (updater: (next: URLSearchParams) => void, options: { replace?: boolean } = { replace: true }) => {
      const next = new URLSearchParams(searchParams);
      updater(next);
      setSearchParams(next, options);
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const [sourcesRes, locationsRes] = await Promise.all([
          wasteSourceService.getAll({ limit: 100, isActive: true }),
          storageLocationService.getAll({ limit: 100, isActive: true }),
        ]);
        setSources((sourcesRes.data as PaginatedResponse<any>).data);
        setLocations((locationsRes.data as PaginatedResponse<any>).data);
      } catch (error) {
        console.error('Failed to fetch dependencies', error);
      }
    };
    fetchDependencies();
  }, []);

  const filterFields: FilterField[] = [
    {
      id: 'sourceId',
      label: 'Waste Source',
      type: 'searchableSelect',
      options: sources.map((s) => ({ label: s.name, value: s.id })),
    },
    {
      id: 'storageLocationId',
      label: 'Location',
      type: 'searchableSelect',
      options: locations.map((l) => ({ label: l.name, value: l.id })),
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Draft', value: WeightReportStatusEnum.DRAFT },
        { label: 'Open', value: WeightReportStatusEnum.OPEN },
        { label: 'Waiting Approval', value: WeightReportStatusEnum.WAITING_APPROVAL },
        { label: 'Done', value: WeightReportStatusEnum.DONE },
        { label: 'Rejected', value: WeightReportStatusEnum.REJECTED },
      ],
    },
  ];

  const buildListParams = useCallback(
    (pageNum: number, limitNum: number) => ({
      page: pageNum,
      limit: limitNum,
      search: search || undefined,
      sourceId: activeFilters.sourceId?.value,
      storageLocationId: activeFilters.storageLocationId?.value,
      status: activeFilters.status?.value,
    }),
    [search, activeFilters],
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildListParams(page, limit);
      const response = await weightReportService.getAll(params);
      const result = response.data as PaginatedResponse<WeightReport>;
      setData(result.data);
      setTotal(result.meta.total);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [page, limit, buildListParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await weightReportService.delete(deleteId);
      toast.success('Report deleted successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleteId(null);
    }
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    updateSearchParams((next) => {
      ['sourceId', 'storageLocationId', 'status'].forEach((k) => next.delete(k));
      filters.forEach((filter) => {
        next.set(filter.id, String(filter.value));
      });
      next.set('page', '1');
    });
  };

  const handleExportAllPDF = useCallback(async () => {
    try {
      const params = buildListParams(1, 1000);
      const response = await weightReportService.getAll(params);
      const result = response.data as PaginatedResponse<WeightReport>;
      const list = result.data ?? [];
      if (list.length === 0) {
        toast.error('No reports to export');
        return;
      }
      exportCancelledRef.current = false;
      setSinglePdfContext(null);
      setPdfApprovalForExport(null);
      setIsExportingAllPDF(true);
      setExportQueue(list);
      setExportIndex(0);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load reports for export');
    }
  }, [buildListParams]);

  useEffect(() => {
    if (!isExportingAllPDF || exportQueue.length === 0 || exportIndex >= exportQueue.length) {
      return;
    }

    const report = exportQueue[exportIndex];
    const total = exportQueue.length;
    exportCancelledRef.current = false;

    const run = async () => {
      setPdfApprovalForExport(null);
      let approvalHistory: ApprovalStatusHistory | null = null;
      try {
        approvalHistory = await approvalService.checkApprovalStatus(
          report.id,
          APPROVAL_ENTITIES.WEIGHT_REPORT,
        );
      } catch {
        approvalHistory = null;
      }
      if (exportCancelledRef.current) return;

      setPdfApprovalForExport(approvalHistory);
      await new Promise((resolve) => setTimeout(resolve, 320));
      if (exportCancelledRef.current) return;

      try {
        await toPDF();
      } catch {
        toast.error('Failed to export PDF');
        setIsExportingAllPDF(false);
        setExportQueue([]);
        setExportIndex(0);
        setPdfApprovalForExport(null);
        return;
      }

      if (exportCancelledRef.current) return;

      if (exportIndex + 1 < total) {
        setExportIndex((i) => i + 1);
      } else {
        setIsExportingAllPDF(false);
        setExportQueue([]);
        setExportIndex(0);
        setPdfApprovalForExport(null);
        toast.success(`Exported ${total} PDF(s) successfully`);
      }
    };

    void run();
    return () => {
      exportCancelledRef.current = true;
    };
  }, [isExportingAllPDF, exportIndex, exportQueue, toPDF]);

  useEffect(() => {
    if (!singlePdfContext || !isExportingRowPdf) return;
    let cancelled = false;

    const run = async () => {
      await new Promise((r) => setTimeout(r, 400));
      if (cancelled) return;
      try {
        await toPDF();
        toast.success('PDF exported successfully');
      } catch {
        toast.error('Failed to export PDF');
      } finally {
        if (!cancelled) {
          setSinglePdfContext(null);
          setIsExportingRowPdf(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [singlePdfContext, isExportingRowPdf, toPDF]);

  const handleExportRowPDF = async (item: WeightReport) => {
    if (isExportingAllPDF) return;
    setIsExportingRowPdf(true);
    try {
      const fullRes = await weightReportService.getById(item.id);
      const report = fullRes.data as WeightReport;
      let approval: ApprovalStatusHistory | null = null;
      try {
        approval = await approvalService.checkApprovalStatus(item.id, APPROVAL_ENTITIES.WEIGHT_REPORT);
      } catch {
        approval = null;
      }
      setSinglePdfContext({ report, approval });
    } catch {
      toast.error('Failed to export PDF');
      setIsExportingRowPdf(false);
    }
  };

  const columns = [
    {
      id: 'reportCode',
      header: 'Report Code',
      cell: (item: WeightReport) => item.reportCode,
      isSortable: true,
    },
    {
      id: 'source',
      header: 'Source',
      cell: (item: WeightReport) => item.source?.name || '-',
      isSortable: true,
    },
    {
      id: 'location',
      header: 'Location',
      cell: (item: WeightReport) => item.storageLocation?.name || '-',
      isSortable: true,
    },
    {
      id: 'reportDate',
      header: 'Report Date',
      cell: (item: WeightReport) => new Date(item.reportDate).toLocaleDateString(),
      isSortable: true,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item: WeightReport) => getStatusBadge(item.status),
      isSortable: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (item: WeightReport) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/waste-management/weight-reports/${item.id}`)}>
              <Eye className="mr-2 h-4 w-4" /> View Detail
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isExportingAllPDF || isExportingRowPdf}
              onClick={() => void handleExportRowPDF(item)}
            >
              <Printer className="mr-2 h-4 w-4" />
              {isExportingRowPdf ? 'Preparing PDF…' : 'Export PDF'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/waste-management/weight-reports/${item.id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeleteId(item.id)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Solid Waste Recording"
        subtitle="Weight reports for solid waste management"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportAllPDF}
              disabled={isExportingAllPDF || isExportingRowPdf || loading}
            >
              {isExportingAllPDF ? `Exporting... (${exportIndex + 1}/${exportQueue.length})` : 'Export All PDF'}
            </Button>
            <Button onClick={() => navigate('/waste-management/weight-reports/create')}>
              <Plus className="mr-2 h-4 w-4" /> Add Report
            </Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={data}
        isLoading={loading}
        pagination={{
          pageIndex: page - 1,
          limit,
          pageCount: Math.ceil(total / limit),
          onPageChange: (newPage) => updateSearchParams((next) => next.set('page', String(newPage + 1))),
          onPageSizeChange: (newLimit) => updateSearchParams((next) => {
            next.set('limit', String(newLimit));
            next.set('page', '1');
          }),
          total,
        }}
        filterFields={filterFields}
        activeFilters={activeFilters}
        searchValue={search}
        searchPlaceholder="Search by report code..."
        onSearch={(term) => updateSearchParams((next) => {
          next.set('search', term || '');
          next.set('page', '1');
        })}
        onApplyFilters={handleApplyFilters}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Report"
        description="Are you sure you want to delete this report? This action cannot be undone."
        onConfirm={handleDelete}
        variant="destructive"
      />

      {/* Hidden PDF template: bulk export or single-row export */}
      <div className="absolute left-[-9999px] top-0" style={{ width: '210mm' }} aria-hidden="true">
        <div ref={targetRef}>
          {activePdfReport && (
            <WeightReportPDFTemplate
              key={`${activePdfReport.id}-${singlePdfContext ? 'single' : 'bulk'}`}
              report={activePdfReport}
              approvalHistory={activePdfApproval}
            />
          )}
        </div>
      </div>
    </>
  );
}
