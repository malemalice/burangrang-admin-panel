import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { usePDF } from 'react-to-pdf';
import { Plus, MoreHorizontal, Pencil, Trash2, Eye, FileText, FileDown } from 'lucide-react';
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
import { monthlyFlowReportService, treatmentPlantService } from '../../services/wasteManagementService';
import { MonthlyFlowReport, PaginatedResponse, TreatmentPlant } from '../../types/waste-management.types';
import { formatDate } from '@/core/utils/date';
import { format } from 'date-fns';
import { MonthlyFlowReportPDFTemplate } from '../../components/MonthlyFlowReportPDFTemplate';

export default function MonthlyFlowReportsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<MonthlyFlowReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [plants, setPlants] = useState<TreatmentPlant[]>([]);
  const [exportQueue, setExportQueue] = useState<MonthlyFlowReport[]>([]);
  const [exportIndex, setExportIndex] = useState(0);
  const [isExportingAllPDF, setIsExportingAllPDF] = useState(false);
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
      : 'monthly-flow-report.pdf';
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
      const plant = plants.find((p) => p.id === treatmentPlantId);
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
  }, [searchParams, plants]);

  const updateSearchParams = useCallback(
    (updater: (next: URLSearchParams) => void, options: { replace?: boolean } = { replace: true }) => {
      const next = new URLSearchParams(searchParams);
      updater(next);
      setSearchParams(next, options);
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const response = await treatmentPlantService.getAll({ page: 1, limit: 100, isActive: true });
        setPlants(response.data.data);
      } catch (error) {
        console.error('Failed to fetch plants', error);
      }
    };
    fetchPlants();
  }, []);

  const filterFields: FilterField[] = [
    {
      id: 'treatmentPlantId',
      label: 'Treatment Plant',
      type: 'searchableSelect',
      options: plants.map((plant) => ({
        label: plant.name,
        value: plant.id,
      })),
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
        treatmentPlantId: activeFilters.treatmentPlantId?.value,
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
      const response = await monthlyFlowReportService.getAll(params);
      const result = response.data as PaginatedResponse<MonthlyFlowReport>;
      setData(result.data);
      setTotal(result.meta.total);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch data');
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
      const response = await monthlyFlowReportService.getAll(params);
      const result = response.data as PaginatedResponse<MonthlyFlowReport>;
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

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await monthlyFlowReportService.delete(deleteId);
      toast.success('Deleted successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleteId(null);
    }
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

  const columns = [
    {
      id: 'reportCode',
      header: 'Code',
      cell: (item: MonthlyFlowReport) => item.reportCode,
      isSortable: true,
    },
    {
      id: 'treatmentPlant',
      header: 'Treatment Plant',
      cell: (item: MonthlyFlowReport) => item.treatmentPlant?.name || '-',
      isSortable: true,
    },
    {
      id: 'reportDate',
      header: 'Report Date',
      cell: (item: MonthlyFlowReport) => formatDate(item.reportDate || ''),
      isSortable: true,
    },
    {
      id: 'totalVolume',
      header: 'Total Volume',
      cell: (item: MonthlyFlowReport) => `${item.totalVolume?.toLocaleString()} m³`,
      isSortable: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (item: MonthlyFlowReport) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/waste-management/monthly-flow-reports/${item.id}`)}>
              <Eye className="mr-2 h-4 w-4" /> View Detail
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/waste-management/monthly-flow-reports/${item.id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/waste-management/monthly-flow-reports/${item.id}?print=true`)}>
              <FileText className="mr-2 h-4 w-4" /> Export PDF
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
      <div
        className="absolute left-[-9999px] top-0"
        style={{ width: '210mm' }}
        aria-hidden="true"
      >
        <div ref={targetRef}>
          {currentReportForPDF ? (
            <MonthlyFlowReportPDFTemplate report={currentReportForPDF} />
          ) : (
            <div className="bg-white p-8" />
          )}
        </div>
      </div>

      <PageHeader
        title="Waste Water Flow Recording"
        subtitle="Monthly flow reports for treatment plants"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportAllPDF}
              disabled={loading || isExportingAllPDF}
            >
              {isExportingAllPDF ? (
                <>Preparing PDFs…</>
              ) : (
                <>
                  <FileDown className="mr-2 h-4 w-4" /> Export all PDF
                </>
              )}
            </Button>
            <Button onClick={() => navigate('/waste-management/monthly-flow-reports/create')}>
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
          onPageChange: (newPage) => {
            updateSearchParams((next) => next.set('page', String(newPage + 1)));
          },
          onPageSizeChange: (newLimit) => {
            updateSearchParams((next) => {
              next.set('limit', String(newLimit));
              next.set('page', '1');
            });
          },
          total,
        }}
        filterFields={filterFields}
        activeFilters={activeFilters}
        searchValue={search}
        onSearch={(term) => {
          updateSearchParams((next) => {
            if (term) next.set('search', term);
            else next.delete('search');
            next.set('page', '1');
          });
        }}
        onApplyFilters={handleApplyFilters}
        searchPlaceholder="Search by report code"
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
