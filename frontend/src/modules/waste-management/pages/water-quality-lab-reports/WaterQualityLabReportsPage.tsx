import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { usePDF } from 'react-to-pdf';
import { Plus, Pencil, Trash2, Eye, FileDown } from 'lucide-react';
import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
import DataTable from '@/core/components/ui/data-table/DataTable';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import { waterQualityLabReportService, treatmentPlantService } from '../../services/wasteManagementService';
import {
  WaterQualityLabReport,
  PaginatedResponse,
  TreatmentPlant,
  WaterQualityLabReportCategoryEnum,
} from '../../types/waste-management.types';

const WATER_LAB_REPORT_CATEGORY_LABELS: Record<WaterQualityLabReportCategoryEnum, string> = {
  [WaterQualityLabReportCategoryEnum.WASTEWATER]: 'Wastewater',
  [WaterQualityLabReportCategoryEnum.CLEAN_WATER]: 'Clean water',
  [WaterQualityLabReportCategoryEnum.SWIMMING_POOL_WATER]: 'Swimming pool water',
  [WaterQualityLabReportCategoryEnum.DRINKING_WATER]: 'Drinking water',
};
import { format } from 'date-fns';
import {
  buildWaterQualityLabReportAggregate,
  type WaterQualityLabReportAggregateData,
} from '../../utils/water-quality-lab-report-export';
import { WaterQualityLabReportAggregatePDFTemplate } from '../../components/WaterQualityLabReportAggregatePDFTemplate';
import { WaterQualityLabReportPDFTemplate } from '../../components/WaterQualityLabReportPDFTemplate';
import { buildPdfOptions, generateTableAwarePdf } from '@/core/lib/pdfExport';

export default function WaterQualityLabReportsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<WaterQualityLabReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [treatmentPlants, setTreatmentPlants] = useState<TreatmentPlant[]>([]);
  const [aggregateForPDF, setAggregateForPDF] =
    useState<WaterQualityLabReportAggregateData | null>(null);
  const [isExportingAllPDF, setIsExportingAllPDF] = useState(false);
  const [reportForSinglePdf, setReportForSinglePdf] = useState<WaterQualityLabReport | null>(null);
  const [exportingSinglePdfId, setExportingSinglePdfId] = useState<string | null>(null);
  const pdfFilename = useMemo(
    () =>
      reportForSinglePdf
        ? `${reportForSinglePdf.reportCode}-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`
        : aggregateForPDF
          ? `water-quality-lab-reports-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`
          : 'water-quality-lab-reports.pdf',
    [aggregateForPDF, reportForSinglePdf],
  );
  const { targetRef } = usePDF(
    buildPdfOptions({
      filename: pdfFilename,
    }),
  );

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
    const category = searchParams.get('category');
    if (category && Object.values(WaterQualityLabReportCategoryEnum).includes(category as WaterQualityLabReportCategoryEnum)) {
      filters.category = {
        value: category,
        label: WATER_LAB_REPORT_CATEGORY_LABELS[category as WaterQualityLabReportCategoryEnum],
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
      id: 'category',
      label: 'Category',
      type: 'select',
      options: (Object.keys(WATER_LAB_REPORT_CATEGORY_LABELS) as WaterQualityLabReportCategoryEnum[]).map((key) => ({
        label: WATER_LAB_REPORT_CATEGORY_LABELS[key],
        value: key,
      })),
    },
    {
      id: 'reportDateRange',
      label: 'Report Date',
      type: 'dateRange',
      dateRangeMode: 'date',
      showRelativePresets: true,
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
        category: activeFilters.category?.value as WaterQualityLabReportCategoryEnum | undefined,
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
      const aggregate = buildWaterQualityLabReportAggregate(
        list,
        WATER_LAB_REPORT_CATEGORY_LABELS,
      );
      setIsExportingAllPDF(true);
      setAggregateForPDF(aggregate);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load reports for export');
    }
  }, [buildListParams]);

  useEffect(() => {
    if (!aggregateForPDF || !isExportingAllPDF) return;
    const timer = setTimeout(async () => {
      try {
        await generateTableAwarePdf(targetRef, buildPdfOptions({ filename: pdfFilename }));
        toast.success('Exported as PDF');
      } catch (err) {
        toast.error('Failed to export PDF');
      } finally {
        setAggregateForPDF(null);
        setIsExportingAllPDF(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [aggregateForPDF, isExportingAllPDF, targetRef, pdfFilename]);

  const handleExportSinglePDF = useCallback(async (id: string) => {
    try {
      setExportingSinglePdfId(id);
      const response = await waterQualityLabReportService.getById(id);
      setReportForSinglePdf(response.data as WaterQualityLabReport);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load report for export');
      setExportingSinglePdfId(null);
    }
  }, []);

  useEffect(() => {
    if (!reportForSinglePdf || !exportingSinglePdfId || reportForSinglePdf.id !== exportingSinglePdfId)
      return;
    const timer = setTimeout(async () => {
      try {
        await generateTableAwarePdf(targetRef, buildPdfOptions({ filename: pdfFilename }));
        toast.success('PDF exported successfully');
      } catch (err) {
        toast.error('Failed to export PDF');
      } finally {
        setReportForSinglePdf(null);
        setExportingSinglePdfId(null);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [reportForSinglePdf, exportingSinglePdfId, targetRef, pdfFilename]);

  const handleSearch = (term: string) => {
    updateSearchParams((next) => {
      if (term === '') next.delete('search');
      else next.set('search', term);
      next.set('page', '1');
    });
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    updateSearchParams((next) => {
      ['treatmentPlantId', 'category', 'reportDateFrom', 'reportDateTo'].forEach((k) => next.delete(k));
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
      id: 'category',
      header: 'Category',
      cell: (item: WaterQualityLabReport) => (item.category ? WATER_LAB_REPORT_CATEGORY_LABELS[item.category] : '-'),
      isSortable: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      headerClassName: 'justify-center',
      cellClassName: 'text-center align-middle',
      cell: (item: WaterQualityLabReport) => (
        <div className="flex flex-wrap items-center justify-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            aria-label="View details"
            onClick={() => navigate(`/waste-management/water-quality-lab-reports/${item.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            aria-label="Export PDF"
            disabled={exportingSinglePdfId === item.id}
            onClick={() => handleExportSinglePDF(item.id)}
          >
            <FileDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            aria-label="Edit"
            onClick={() => navigate(`/waste-management/water-quality-lab-reports/${item.id}/edit`)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
            aria-label="Delete"
            onClick={() => setDeleteId(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      {(aggregateForPDF || reportForSinglePdf) && (
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
          {aggregateForPDF && (
            <WaterQualityLabReportAggregatePDFTemplate data={aggregateForPDF} />
          )}
          {reportForSinglePdf && (
            <WaterQualityLabReportPDFTemplate report={reportForSinglePdf} />
          )}
        </div>
      )}
      <PageHeader
        title="Water Monitoring"
        subtitle="Water monitoring laboratory reports"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportAllPDF}
              disabled={isExportingAllPDF || loading}
            >
              <FileDown className="mr-2 h-4 w-4" />
              {isExportingAllPDF ? 'Exporting…' : 'Export PDF'}
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
        title="Delete Water Monitoring"
        description="Are you sure you want to delete this water monitoring record? This action cannot be undone."
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}
