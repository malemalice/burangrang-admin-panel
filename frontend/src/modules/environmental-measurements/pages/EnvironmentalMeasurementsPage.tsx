import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { usePDF } from 'react-to-pdf';
import { Edit, Trash2, Plus, MoreHorizontal, Eye, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { Button, ThemeButton } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import DataTable from '@/core/components/ui/data-table/DataTable';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import environmentalMeasurementService from '../services/environmentalMeasurementService';
import { EnvironmentalMeasurement } from '../types/environmental-measurement.types';
import { EnvironmentalMeasurementListPDFTemplate } from '../components/EnvironmentalMeasurementListPDFTemplate';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import { PermissionGuard } from '@/core/components/ui/PermissionGuard';
import { usePermissions } from '@/core/hooks/usePermissions';
import { EnvironmentalMeasurementRegulatoryLimits } from '../services/environmentalMeasurementService';
import { MetricValueWithRegulatoryLimit } from '../components/MetricValueWithRegulatoryLimit';
import { GeneralStatusEnum, GENERAL_STATUS_OPTIONS } from '@/shared/constants/general-status.enum';

function getStatusBadge(status?: string) {
  switch (status) {
    case GeneralStatusEnum.DRAFT:
      return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300 text-xs">Draft</Badge>;
    case GeneralStatusEnum.OPEN:
      return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-xs">Open</Badge>;
    case GeneralStatusEnum.WAITING_APPROVAL:
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">Waiting Approval</Badge>;
    case GeneralStatusEnum.DONE:
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs">Done</Badge>;
    case GeneralStatusEnum.REJECTED:
      return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 text-xs">Rejected</Badge>;
    default:
      return status ? <Badge variant="outline" className="text-xs">{status}</Badge> : <span className="text-muted-foreground text-xs">—</span>;
  }
}

export default function EnvironmentalMeasurementsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission } = usePermissions();
  const [measurements, setMeasurements] = useState<EnvironmentalMeasurement[]>([]);
  const [totalMeasurements, setTotalMeasurements] = useState(0);
  const [regulatoryLimits, setRegulatoryLimits] = useState<EnvironmentalMeasurementRegulatoryLimits | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [measurementToDelete, setMeasurementToDelete] = useState<EnvironmentalMeasurement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [allMeasurementsForPDF, setAllMeasurementsForPDF] = useState<EnvironmentalMeasurement[]>([]);
  /** Limits snapshot for list PDF export (set when exporting so PDF matches fetched data). */
  const [listPdfRegulatoryLimits, setListPdfRegulatoryLimits] =
    useState<EnvironmentalMeasurementRegulatoryLimits | null>(null);
  const [isExportingAllPDF, setIsExportingAllPDF] = useState(false);
  const [exportingRowId, setExportingRowId] = useState<string | null>(null);

  const { toPDF, targetRef } = usePDF({
    filename: `environmental-measurements-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`,
  });

  const pageIndex = useMemo(() => {
    const raw = searchParams.get('page');
    const page = raw ? Number(raw) : 1;
    if (!Number.isFinite(page) || page <= 0) return 0;
    return Math.floor(page) - 1;
  }, [searchParams]);

  const limit = useMemo(() => {
    const raw = searchParams.get('limit');
    const parsed = raw ? Number(raw) : 10;
    if (!Number.isFinite(parsed) || parsed <= 0) return 10;
    return Math.floor(parsed);
  }, [searchParams]);

  const searchTerm = useMemo(() => searchParams.get('search') ?? '', [searchParams]);

  const activeFilters = useMemo(() => {
    const filters: Record<string, { value: any; label: string }> = {};
    const roomName = searchParams.get('roomName');
    if (roomName) {
      filters.roomName = { value: roomName, label: roomName };
    }
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate || endDate) {
      const from = startDate ? (startDate.includes('T') ? startDate.split('T')[0] : startDate) : undefined;
      const to = endDate ? (endDate.includes('T') ? endDate.split('T')[0] : endDate) : undefined;
      filters.dateRange = {
        value: { from: from || undefined, to: to || undefined },
        label: [from, to].filter(Boolean).map((d) => format(new Date(d!), 'dd MMM yyyy')).join(' – ') || 'Date range',
      };
    }
    const status = searchParams.get('status');
    if (status) {
      const option = GENERAL_STATUS_OPTIONS.find((o) => o.value === status);
      filters.status = { value: status, label: option?.label ?? status };
    }
    return filters;
  }, [searchParams]);

  // Define filter fields
  const filterFields: FilterField[] = [
    {
      id: 'dateRange',
      label: 'Measurement date range',
      type: 'dateRange',
      dateRangeMode: 'date',
    },
    {
      id: 'roomName',
      label: 'Room Name',
      type: 'text',
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: GENERAL_STATUS_OPTIONS.filter((o) =>
        [GeneralStatusEnum.DRAFT, GeneralStatusEnum.OPEN, GeneralStatusEnum.WAITING_APPROVAL, GeneralStatusEnum.DONE, GeneralStatusEnum.REJECTED].includes(o.value as GeneralStatusEnum),
      ).map((o) => ({ value: o.value, label: o.label })),
    },
  ];

  const updateSearchParams = useCallback(
    (updater: (next: URLSearchParams) => void, options: { replace?: boolean } = { replace: true }) => {
      const next = new URLSearchParams(searchParams);
      updater(next);
      setSearchParams(next, options);
    },
    [searchParams, setSearchParams]
  );

  const getDateRangeParams = useCallback(() => {
    const range = activeFilters.dateRange?.value as { from?: string; to?: string } | undefined;
    if (!range) return {};
    const from = range.from ? (range.from.includes('T') ? range.from.split('T')[0] : range.from) : undefined;
    const to = range.to ? (range.to.includes('T') ? range.to.split('T')[0] : range.to) : undefined;
    return { startDate: from, endDate: to };
  }, [activeFilters.dateRange]);

  const fetchMeasurements = useCallback(async () => {
    setIsLoading(true);
    try {
      const { startDate, endDate } = getDateRangeParams();
      const response = await environmentalMeasurementService.getMeasurements({
        page: pageIndex + 1,
        limit,
        search: searchTerm.trim() || activeFilters.roomName?.value || undefined,
        sortBy: 'date',
        sortOrder: 'desc',
        startDate,
        endDate,
        status: activeFilters.status?.value || undefined,
      });
      setMeasurements(response.data);
      setTotalMeasurements(response.meta.total);
    } catch (error) {
      console.error('Failed to fetch measurements:', error);
      toast.error('Failed to load environmental measurements');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, searchTerm, activeFilters, getDateRangeParams]);

  const fetchRegulatoryLimits = useCallback(async () => {
    try {
      const limits = await environmentalMeasurementService.getRegulatoryLimits();
      setRegulatoryLimits(limits);
    } catch (error) {
      console.error('Failed to fetch regulatory limits:', error);
      setRegulatoryLimits(null);
    }
  }, []);

  // Fetch measurements when pagination, search, filters change
  useEffect(() => {
    fetchMeasurements();
  }, [fetchMeasurements]);

  useEffect(() => {
    fetchRegulatoryLimits();
  }, [fetchRegulatoryLimits]);

  const handleDeleteClick = (measurement: EnvironmentalMeasurement, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setOpenDropdownId(null); // Explicitly close the dropdown
    setMeasurementToDelete(measurement);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!measurementToDelete) return;

    setIsLoading(true);
    try {
      await environmentalMeasurementService.deleteMeasurement(measurementToDelete.id);
      toast.success('Environmental measurement has been deleted');
      setOpenDropdownId(null); // Ensure dropdown is closed
      fetchMeasurements();
    } catch (error) {
      console.error('Failed to delete measurement:', error);
      toast.error('Failed to delete environmental measurement');
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setMeasurementToDelete(null);
    }
  };

  const handleDialogCancel = () => {
    setDeleteDialogOpen(false);
    setMeasurementToDelete(null);
    setOpenDropdownId(null); // Ensure dropdown is closed
  };

  const handleSearch = (term: string) => {
    updateSearchParams((next) => {
      if (term.trim() === '') next.delete('search');
      else next.set('search', term.trim());
      next.set('page', '1');
    });
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    updateSearchParams((next) => {
      next.delete('roomName');
      next.delete('startDate');
      next.delete('endDate');
      next.delete('status');
      filters.forEach((filter) => {
        const value = filter.value;
        if (value === undefined || value === null || value === '') return;
        if (filter.id === 'dateRange' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const range = value as { from?: string | Date; to?: string | Date };
          const from = range.from ? (typeof range.from === 'string' ? range.from.split('T')[0] : format(new Date(range.from), 'yyyy-MM-dd')) : undefined;
          const to = range.to ? (typeof range.to === 'string' ? range.to.split('T')[0] : format(new Date(range.to), 'yyyy-MM-dd')) : undefined;
          if (from) next.set('startDate', from);
          if (to) next.set('endDate', to);
          return;
        }
        next.set(filter.id, String(value));
      });
      next.set('page', '1');
    });
  };

  const handleExportAllPDF = useCallback(async () => {
    setIsExportingAllPDF(true);
    try {
      const searchVal = searchTerm.trim() || activeFilters.roomName?.value || undefined;
      const { startDate, endDate } = getDateRangeParams();
      const response = await environmentalMeasurementService.getMeasurements({
        page: 1,
        limit: 10000,
        search: searchVal,
        sortBy: 'date',
        sortOrder: 'desc',
        startDate,
        endDate,
        status: activeFilters.status?.value || undefined,
      });
      const limits =
        regulatoryLimits ?? (await environmentalMeasurementService.getRegulatoryLimits());
      setListPdfRegulatoryLimits(limits);
      setAllMeasurementsForPDF(response.data);
      await new Promise((r) => setTimeout(r, 200));
      await toPDF();
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExportingAllPDF(false);
    }
  }, [searchTerm, activeFilters, getDateRangeParams, regulatoryLimits, toPDF]);

  const handleExportRowPDF = useCallback(
    async (measurement: EnvironmentalMeasurement) => {
      setExportingRowId(measurement.id);
      setOpenDropdownId(null);
      try {
        const limits =
          regulatoryLimits ?? (await environmentalMeasurementService.getRegulatoryLimits());
        setListPdfRegulatoryLimits(limits);
        setAllMeasurementsForPDF([measurement]);
        await new Promise((r) => setTimeout(r, 200));
        await toPDF();
        toast.success('PDF exported successfully');
      } catch (error) {
        console.error('Failed to export PDF:', error);
        toast.error('Failed to export PDF');
      } finally {
        setExportingRowId(null);
      }
    },
    [regulatoryLimits, toPDF],
  );

  const columns = [
    {
      id: 'date',
      header: 'Date',
      cell: (measurement: EnvironmentalMeasurement) => (
        <div className="font-medium">
          {format(new Date(measurement.date), 'PPP')}
        </div>
      ),
    },
    {
      id: 'room',
      header: 'Room',
      cell: (measurement: EnvironmentalMeasurement) => (
        <div>
          <div className="font-medium">
            {measurement.room ? measurement.room.name : '-'}
          </div>
          {measurement.room && (
            <div className="text-xs text-gray-500 mt-1">
              Code: {measurement.room.code}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'lighting',
      header: 'Lighting (lux)',
      cell: (measurement: EnvironmentalMeasurement) => (
        <MetricValueWithRegulatoryLimit
          metric="lighting"
          value={measurement.lighting}
          limit={regulatoryLimits?.lighting.limit}
          mode={regulatoryLimits?.lighting.mode}
          align="right"
        />
      ),
    },
    {
      id: 'noise',
      header: 'Noise (dB)',
      cell: (measurement: EnvironmentalMeasurement) => (
        <MetricValueWithRegulatoryLimit
          metric="noise"
          value={measurement.noise}
          limit={regulatoryLimits?.noise.limit}
          mode={regulatoryLimits?.noise.mode}
          align="right"
        />
      ),
    },
    {
      id: 'humidity',
      header: 'Humidity (%)',
      cell: (measurement: EnvironmentalMeasurement) => (
        <MetricValueWithRegulatoryLimit
          metric="humidity"
          value={measurement.humidity}
          limit={regulatoryLimits?.humidity.limit}
          mode={regulatoryLimits?.humidity.mode}
          align="right"
        />
      ),
    },
    {
      id: 'temperature',
      header: 'Temp (°C)',
      cell: (measurement: EnvironmentalMeasurement) => (
        <MetricValueWithRegulatoryLimit
          metric="temperature"
          value={measurement.temperature}
          limit={regulatoryLimits?.temperature.limit}
          mode={regulatoryLimits?.temperature.mode}
          align="right"
        />
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (measurement: EnvironmentalMeasurement) => getStatusBadge(measurement.status),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (measurement: EnvironmentalMeasurement) => (
        <DropdownMenu
          open={openDropdownId === measurement.id}
          onOpenChange={(open) => {
            setOpenDropdownId(open ? measurement.id : null);
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/environmental-measurements/${measurement.id}`)}>
              <Eye className="mr-2 h-4 w-4" /> View
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void handleExportRowPDF(measurement);
              }}
              disabled={exportingRowId === measurement.id}
            >
              <FileDown className="mr-2 h-4 w-4" />{' '}
              {exportingRowId === measurement.id ? 'Preparing PDF…' : 'Export PDF'}
            </DropdownMenuItem>
            {hasPermission('environmental-measurement:update') && (
              <DropdownMenuItem onClick={() => navigate(`/environmental-measurements/${measurement.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
            )}
            {hasPermission('environmental-measurement:update') && hasPermission('environmental-measurement:delete') && (
              <DropdownMenuSeparator />
            )}
            {hasPermission('environmental-measurement:delete') && (
              <DropdownMenuItem
                onClick={(e) => handleDeleteClick(measurement, e)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Environmental Measurements"
        subtitle="Record and manage environmental measurements for rooms"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAllPDF}
              disabled={isExportingAllPDF}
            >
              <FileDown className="mr-2 h-4 w-4" />
              {isExportingAllPDF ? 'Preparing PDF…' : 'Export all as PDF'}
            </Button>
            <PermissionGuard permission="environmental-measurement:create">
              <ThemeButton onClick={() => navigate('/environmental-measurements/new')}>
                <Plus className="mr-2 h-4 w-4" /> Add Measurement
              </ThemeButton>
            </PermissionGuard>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={measurements}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalMeasurements / limit),
          onPageChange: (nextPageIndex) => {
            updateSearchParams((next) => next.set('page', String(nextPageIndex + 1)));
          },
          onPageSizeChange: (nextLimit) => {
            updateSearchParams((next) => {
              next.set('limit', String(nextLimit));
              next.set('page', '1');
            });
          },
          total: totalMeasurements
        }}
        filterFields={filterFields}
        activeFilters={activeFilters}
        searchValue={searchTerm}
        onSearch={handleSearch}
        onApplyFilters={handleApplyFilters}
        searchPlaceholder="Search by room name, room code, or remarks"
      />

      {/* Hidden PDF target for "Export all as PDF" */}
      <div
        ref={targetRef}
        style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '210mm' }}
        aria-hidden="true"
      >
        <EnvironmentalMeasurementListPDFTemplate
          measurements={allMeasurementsForPDF}
          regulatoryLimits={listPdfRegulatoryLimits ?? regulatoryLimits}
        />
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleDialogCancel();
          }
        }}
        title="Delete Environmental Measurement"
        description="Are you sure you want to delete this environmental measurement record? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </>
  );
}
