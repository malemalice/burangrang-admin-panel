import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { usePDF } from 'react-to-pdf';
import { format } from 'date-fns';
import { Plus, MoreHorizontal, Pencil, Trash2, Eye, Printer } from 'lucide-react';
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
import { weightReportService, wasteSourceService, storageLocationService } from '../../services/wasteManagementService';
import { WeightReport, PaginatedResponse } from '../../types/waste-management.types';
import { WeightReportPDFTemplate } from '../../components/WeightReportPDFTemplate';

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
    const isActive = searchParams.get('isActive');
    if (isActive === 'true' || isActive === 'false') {
      filters.isActive = { value: isActive, label: isActive === 'true' ? 'Active' : 'Inactive' };
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
  const pdfFilename =
    currentReportForPDF
      ? `${currentReportForPDF.reportCode}-${format(new Date(), 'yyyyMMdd-HHmmss')}-${exportIndex + 1}.pdf`
      : 'weight-report.pdf';
  const { toPDF, targetRef } = usePDF({ filename: pdfFilename });

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
      id: 'isActive',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' },
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
      isActive: activeFilters.isActive?.value === 'true' ? true : activeFilters.isActive?.value === 'false' ? false : undefined,
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
      ['sourceId', 'storageLocationId', 'isActive'].forEach((k) => next.delete(k));
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
    const count = exportQueue.length;
    const timer = setTimeout(async () => {
      try {
        await toPDF();
        if (exportIndex + 1 < count) {
          setExportIndex((i) => i + 1);
        } else {
          setIsExportingAllPDF(false);
          setExportQueue([]);
          setExportIndex(0);
          toast.success(`Exported ${count} PDF(s) successfully`);
        }
      } catch (err) {
        toast.error('Failed to export PDF');
        setIsExportingAllPDF(false);
        setExportQueue([]);
        setExportIndex(0);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [isExportingAllPDF, exportQueue.length, exportIndex, toPDF]);

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
      cell: (item: WeightReport) => (
        <Badge variant={item.isActive ? 'default' : 'secondary'}>
          {item.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
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
            <DropdownMenuItem onClick={() => navigate(`/waste-management/weight-reports/${item.id}?print=true`)}>
              <Printer className="mr-2 h-4 w-4" /> Export PDF
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
              disabled={isExportingAllPDF || loading}
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

      {/* Hidden PDF template for Export All */}
      <div className="absolute left-[-9999px] top-0" style={{ width: '210mm' }}>
        <div ref={targetRef}>
          {currentReportForPDF && <WeightReportPDFTemplate report={currentReportForPDF} />}
        </div>
      </div>
    </>
  );
}
