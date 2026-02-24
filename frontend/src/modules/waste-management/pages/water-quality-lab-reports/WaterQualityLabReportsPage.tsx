import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { usePDF } from 'react-to-pdf';
import { Plus, MoreHorizontal, Pencil, Trash2, Eye, FileDown } from 'lucide-react';
import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import DataTable from '@/core/components/ui/data-table/DataTable';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import { waterQualityLabReportService, treatmentPlantService } from '../../services/wasteManagementService';
import { WaterQualityLabReport, PaginatedResponse, TreatmentPlant } from '../../types/waste-management.types';
import { format } from 'date-fns';
import { WaterQualityLabReportPDFTemplate } from '../../components/WaterQualityLabReportPDFTemplate';

export default function WaterQualityLabReportsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<WaterQualityLabReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [treatmentPlants, setTreatmentPlants] = useState<TreatmentPlant[]>([]);
  const [exportQueue, setExportQueue] = useState<WaterQualityLabReport[]>([]);
  const [exportIndex, setExportIndex] = useState(0);
  const [isExportingAllPDF, setIsExportingAllPDF] = useState(false);

  const currentReportForPDF = useMemo(
    () =>
      isExportingAllPDF && exportQueue.length > 0 && exportIndex < exportQueue.length
        ? exportQueue[exportIndex]
        : null,
    [isExportingAllPDF, exportQueue, exportIndex],
  );
  const pdfFilename = useMemo(
    () =>
      currentReportForPDF
        ? `${currentReportForPDF.reportCode}-${format(new Date(), 'yyyyMMdd-HHmmss')}-${exportIndex + 1}.pdf`
        : 'water-quality-lab-report.pdf',
    [currentReportForPDF, exportIndex],
  );
  const { toPDF, targetRef } = usePDF({ filename: pdfFilename });

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
    const treatmentPlantId = searchParams.get('treatmentPlantId');
    if (treatmentPlantId) {
      const plant = treatmentPlants.find((p) => p.id === treatmentPlantId);
      filters.treatmentPlantId = {
        value: treatmentPlantId,
        label: plant?.name ?? treatmentPlantId,
      };
    }
    const reportDateFrom = searchParams.get('reportDateFrom');
    const reportDateTo = searchParams.get('reportDateTo');
    if (reportDateFrom || reportDateTo) {
      const from = reportDateFrom ? new Date(reportDateFrom) : undefined;
      const to = reportDateTo ? new Date(reportDateTo) : undefined;
      const fromStr = from ? format(from, 'dd MMM yyyy') : '';
      const toStr = to ? format(to, 'dd MMM yyyy') : '';
      filters.reportDateRange = {
        value: { from, to },
        label: fromStr && toStr ? `${fromStr} - ${toStr}` : fromStr || toStr,
      };
    }
    return filters;
  }, [searchParams, treatmentPlants]);

  const updateSearchParams = useCallback(
    (updater: (next: URLSearchParams) => void, options: { replace?: boolean } = { replace: true }) => {
      const next = new URLSearchParams(searchParams);
      updater(next);
      setSearchParams(next, options);
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    const fetchTreatmentPlants = async () => {
      try {
        const response = await treatmentPlantService.getAll({ limit: 100 });
        setTreatmentPlants((response.data as PaginatedResponse<TreatmentPlant>).data);
      } catch (error) {
        console.error('Failed to fetch treatment plants:', error);
      }
    };
    fetchTreatmentPlants();
  }, []);

  const filterFields: FilterField[] = [
    {
      id: 'treatmentPlantId',
      label: 'Treatment Plant',
      type: 'searchableSelect',
      options: treatmentPlants.map((tp) => ({ label: tp.name, value: tp.id })),
    },
    {
      id: 'reportDateRange',
      label: 'Report Date',
      type: 'dateRange',
    },
  ];

  const buildListParams = useCallback(
    (pageNum: number, limitNum: number) => {
      const reportDateRange = activeFilters.reportDateRange?.value as { from?: Date; to?: Date } | undefined;
      return {
        page: pageNum,
        limit: limitNum,
        search: search || undefined,
        treatmentPlantId: activeFilters.treatmentPlantId?.value as string | undefined,
        reportDateFrom: reportDateRange?.from
          ? (typeof reportDateRange.from === 'string' ? reportDateRange.from : reportDateRange.from.toISOString())
          : undefined,
        reportDateTo: reportDateRange?.to
          ? (typeof reportDateRange.to === 'string' ? reportDateRange.to : reportDateRange.to.toISOString())
          : undefined,
      };
    },
    [search, activeFilters],
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildListParams(page, limit);
      const response = await waterQualityLabReportService.getAll(params);
      const result = response.data as PaginatedResponse<WaterQualityLabReport>;
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

  const handleExportAllPDF = useCallback(async () => {
    try {
      const params = buildListParams(1, 1000);
      const response = await waterQualityLabReportService.getAll(params);
      const result = response.data as PaginatedResponse<WaterQualityLabReport>;
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

  const handleSearch = (term: string) => {
    updateSearchParams((next) => {
      if (term === '') next.delete('search');
      else next.set('search', term);
      next.set('page', '1');
    });
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    updateSearchParams((next) => {
      ['treatmentPlantId', 'reportDateFrom', 'reportDateTo'].forEach((k) => next.delete(k));
      filters.forEach((filter) => {
        if (filter.id === 'reportDateRange') {
          const v = filter.value as { from?: Date; to?: Date };
          if (v?.from) next.set('reportDateFrom', typeof v.from === 'string' ? v.from : v.from.toISOString());
          if (v?.to) next.set('reportDateTo', typeof v.to === 'string' ? v.to : v.to.toISOString());
        } else {
          next.set(filter.id, String(filter.value));
        }
      });
      next.set('page', '1');
    });
  };

  const handlePageChange = (newPage: number) => {
    updateSearchParams((next) => next.set('page', String(newPage + 1)));
  };

  const handlePageSizeChange = (newLimit: number) => {
    updateSearchParams((next) => {
      next.set('limit', String(newLimit));
      next.set('page', '1');
    });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await waterQualityLabReportService.delete(deleteId);
      toast.success('Report deleted successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleteId(null);
    }
  };

  const columns = [
    {
      id: 'reportCode',
      header: 'Report Code',
      cell: (item: WaterQualityLabReport) => item.reportCode,
      isSortable: true,
    },
    {
      id: 'treatmentPlant',
      header: 'Treatment Plant',
      cell: (item: WaterQualityLabReport) => item.treatmentPlant?.name || '-',
      isSortable: true,
    },
    {
      id: 'reportDate',
      header: 'Report Date',
      cell: (item: WaterQualityLabReport) => new Date(item.reportDate).toLocaleDateString(),
      isSortable: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (item: WaterQualityLabReport) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/waste-management/water-quality-lab-reports/${item.id}`)}>
              <Eye className="mr-2 h-4 w-4" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/waste-management/water-quality-lab-reports/${item.id}/edit`)}>
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
      {currentReportForPDF && (
        <div
          ref={targetRef}
          style={{
            position: 'absolute',
            left: '-9999px',
            top: '-9999px',
            width: '210mm',
          }}
          aria-hidden="true"
        >
          <WaterQualityLabReportPDFTemplate report={currentReportForPDF} />
        </div>
      )}
      <PageHeader
        title="Waste Water Lab Results"
        subtitle="Water quality laboratory test reports"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportAllPDF}
              disabled={isExportingAllPDF || loading}
            >
              <FileDown className="mr-2 h-4 w-4" />
              {isExportingAllPDF ? 'Exporting…' : 'Export all PDF'}
            </Button>
            <Button onClick={() => navigate('/waste-management/water-quality-lab-reports/create')}>
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
          onPageChange: handlePageChange,
          onPageSizeChange: handlePageSizeChange,
          total,
        }}
        filterFields={filterFields}
        activeFilters={activeFilters}
        searchValue={search}
        onSearch={handleSearch}
        onApplyFilters={handleApplyFilters}
        searchPlaceholder="Search by report code..."
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Report"
        description="Are you sure you want to delete this report? This action cannot be undone."
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}
