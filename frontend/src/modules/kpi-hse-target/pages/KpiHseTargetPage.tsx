import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, MoreHorizontal, FileDown } from 'lucide-react';
import { usePDF } from 'react-to-pdf';
import { Button, ThemeButton } from '@/core/components/ui/button';
import { buildPdfOptions, generateTableAwarePdf } from '@/core/lib/pdfExport';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import { Badge } from '@/core/components/ui/badge';
import DataTable from '@/core/components/ui/data-table/DataTable';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import kpiHseTargetService from '../services/kpiHseTargetService';
import {
  HseTarget,
  HseTargetType,
  TYPE_LABELS,
  MONTH_SHORT_LABELS,
} from '../types/kpi-hse-target.types';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import { PermissionGuard } from '@/core/components/ui/PermissionGuard';
import { usePermissions } from '@/core/hooks/usePermissions';
import { KpiHseTargetListPDFTemplate } from '../components/KpiHseTargetListPDFTemplate';

export default function KpiHseTargetPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission } = usePermissions();

  const [hseTargets, setHseTargets] = useState<HseTarget[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [targetToDelete, setTargetToDelete] = useState<HseTarget | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [allTargetsForPDF, setAllTargetsForPDF] = useState<HseTarget[]>([]);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const { targetRef } = usePDF(
    buildPdfOptions({
      filename: `kpi-hse-target-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`,
    }),
  );

  const currentYear = new Date().getFullYear();

  // --- URL-derived state ---
  const pageIndex = useMemo(() => {
    const raw = searchParams.get('page');
    const p = raw ? Number(raw) : 1;
    return Number.isFinite(p) && p > 0 ? Math.floor(p) - 1 : 0;
  }, [searchParams]);

  const limit = useMemo(() => {
    const raw = searchParams.get('limit');
    const p = raw ? Number(raw) : 10;
    return Number.isFinite(p) && p > 0 ? Math.floor(p) : 10;
  }, [searchParams]);

  const searchTerm = useMemo(() => searchParams.get('search') ?? '', [searchParams]);

  const activeFilters = useMemo(() => {
    const filters: Record<string, { value: any; label: string }> = {};
    const typeVal = searchParams.get('type');
    if (typeVal) filters.type = { value: typeVal, label: TYPE_LABELS[typeVal as HseTargetType] ?? typeVal };
    const yearVal = searchParams.get('year');
    if (yearVal) filters.year = { value: yearVal, label: yearVal };
    const statusVal = searchParams.get('status');
    if (statusVal) filters.status = { value: statusVal, label: statusVal === 'active' ? 'Active' : 'Inactive' };
    return filters;
  }, [searchParams]);

  // --- Filter fields ---
  const filterFields: FilterField[] = [
    {
      id: 'type',
      label: 'Type',
      type: 'searchableSelect',
      options: [
        { label: 'Incident', value: 'INCIDENT' },
        { label: 'Risk', value: 'RISK' },
        { label: 'Inspection', value: 'INSPECTION' },
        { label: 'Audit', value: 'AUDIT' },
      ],
    },
    {
      id: 'year',
      label: 'Year',
      type: 'searchableSelect',
      options: Array.from({ length: 10 }, (_, i) => ({
        label: String(currentYear - i),
        value: String(currentYear - i),
      })),
    },
    {
      id: 'status',
      label: 'Status',
      type: 'searchableSelect',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
  ];

  // --- URL update helper ---
  const updateSearchParams = useCallback(
    (updater: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams);
      updater(next);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  // --- Handlers ---
  const handlePageChange = (page: number) => {
    updateSearchParams((n) => { n.set('page', String(page + 1)); });
  };

  const handlePageSizeChange = (size: number) => {
    updateSearchParams((n) => { n.set('limit', String(size)); n.set('page', '1'); });
  };

  const handleSearch = (term: string) => {
    updateSearchParams((n) => {
      term.trim() ? n.set('search', term.trim()) : n.delete('search');
      n.set('page', '1');
    });
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    updateSearchParams((n) => {
      ['type', 'year', 'status'].forEach((k) => n.delete(k));
      filters.forEach((f) => { if (f.value) n.set(f.id, String(f.value)); });
      n.set('page', '1');
    });
  };

  // --- Data fetch ---
  const fetchHseTargets = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await kpiHseTargetService.getHseTargets({
        page: pageIndex + 1,
        limit,
        search: searchTerm || undefined,
        sortBy: 'year',
        sortOrder: 'desc',
        type: activeFilters.type?.value,
        year: activeFilters.year?.value ? parseInt(activeFilters.year.value) : undefined,
        isActive:
          activeFilters.status?.value === 'active'
            ? true
            : activeFilters.status?.value === 'inactive'
              ? false
              : undefined,
      });
      setHseTargets(response.data);
      setTotal(response.meta.total);
    } catch (error) {
      console.error('Failed to fetch HSE targets:', error);
      toast.error('Failed to load HSE targets');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, searchTerm, activeFilters]);

  useEffect(() => {
    fetchHseTargets();
  }, [fetchHseTargets]);

  // --- Delete ---
  const handleDeleteClick = (target: HseTarget, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setOpenDropdownId(null);
    setTargetToDelete(target);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!targetToDelete) return;
    setIsLoading(true);
    try {
      await kpiHseTargetService.deleteHseTarget(targetToDelete.id);
      toast.success('HSE target has been deleted');
      setOpenDropdownId(null);
      fetchHseTargets();
    } catch (error) {
      console.error('Failed to delete HSE target:', error);
      toast.error('Failed to delete HSE target');
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setTargetToDelete(null);
    }
  };

  // --- PDF export ---
  const handleExportPDF = useCallback(async () => {
    setIsExportingPDF(true);
    try {
      const response = await kpiHseTargetService.getHseTargets({
        page: 1,
        limit: 10000,
        search: searchTerm || undefined,
        sortBy: 'year',
        sortOrder: 'desc',
        type: activeFilters.type?.value,
        year: activeFilters.year?.value ? parseInt(activeFilters.year.value) : undefined,
        isActive:
          activeFilters.status?.value === 'active'
            ? true
            : activeFilters.status?.value === 'inactive'
              ? false
              : undefined,
      });
      setAllTargetsForPDF(response.data);
      await new Promise((r) => setTimeout(r, 200));
      await generateTableAwarePdf(
        targetRef,
        buildPdfOptions({
          filename: `kpi-hse-target-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`,
        }),
      );
      toast.success('PDF exported successfully');
    } catch {
      toast.error('Failed to export PDF');
    } finally {
      setIsExportingPDF(false);
    }
  }, [searchTerm, activeFilters, targetRef]);

  // --- Columns ---
  const columns = [
    {
      id: 'type',
      header: 'Type',
      cell: (target: HseTarget) => (
        <Badge variant="outline" className="border-0 bg-slate-100 text-slate-800">
          {TYPE_LABELS[target.type]}
        </Badge>
      ),
    },
    {
      id: 'code',
      header: 'Code',
      cell: (target: HseTarget) => <div className="font-medium">{target.code}</div>,
    },
    {
      id: 'name',
      header: 'Name',
      cell: (target: HseTarget) => <div>{target.name || '-'}</div>,
    },
    {
      id: 'period',
      header: 'Period',
      cell: (target: HseTarget) => (
        <div>{target.month ? `${MONTH_SHORT_LABELS[target.month]} ${target.year}` : `Yearly ${target.year}`}</div>
      ),
    },
    {
      id: 'target',
      header: 'Target',
      headerClassName: 'justify-end',
      cell: (target: HseTarget) => <div className="text-right font-medium">{target.target}</div>,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (target: HseTarget) => (
        <Badge
          variant="outline"
          className={`${target.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} border-0`}
        >
          {target.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (target: HseTarget) => (
        <DropdownMenu
          open={openDropdownId === target.id}
          onOpenChange={(open) => setOpenDropdownId(open ? target.id : null)}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {hasPermission('kpi-hse-target:update') && (
              <DropdownMenuItem onClick={() => navigate(`/dashboard/kpi-hse-target/${target.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
            )}
            {hasPermission('kpi-hse-target:update') && hasPermission('kpi-hse-target:delete') && (
              <DropdownMenuSeparator />
            )}
            {hasPermission('kpi-hse-target:delete') && (
              <DropdownMenuItem
                onClick={(e) => handleDeleteClick(target, e)}
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
        title="HSE Target"
        subtitle="Manage HSE targets for actual vs target comparison"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isExportingPDF}>
              <FileDown className="mr-2 h-4 w-4" />
              {isExportingPDF ? 'Preparing PDF...' : 'Export PDF'}
            </Button>
            <PermissionGuard permission="kpi-hse-target:create">
              <ThemeButton onClick={() => navigate('/dashboard/kpi-hse-target/new')}>
                <Plus className="mr-2 h-4 w-4" /> Add Target
              </ThemeButton>
            </PermissionGuard>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={hseTargets}
        isLoading={isLoading}
        searchPlaceholder="Search by code or name..."
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(total / limit),
          onPageChange: handlePageChange,
          onPageSizeChange: handlePageSizeChange,
          total,
        }}
        filterFields={filterFields}
        activeFilters={activeFilters}
        onSearch={handleSearch}
        onApplyFilters={handleApplyFilters}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialogOpen(false);
            setTargetToDelete(null);
            setOpenDropdownId(null);
          }
        }}
        title="Delete HSE Target"
        description="Are you sure you want to delete this HSE target? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />

      <div
        ref={targetRef}
        style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '210mm' }}
        aria-hidden="true"
      >
        <KpiHseTargetListPDFTemplate targets={allTargetsForPDF} />
      </div>
    </>
  );
}
