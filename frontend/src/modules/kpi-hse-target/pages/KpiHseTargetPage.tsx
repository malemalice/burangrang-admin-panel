import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, MoreHorizontal } from 'lucide-react';
import { Button, ThemeButton } from '@/core/components/ui/button';
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
  TYPE_LABELS,
  MONTH_SHORT_LABELS,
} from '../types/kpi-hse-target.types';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import { PermissionGuard } from '@/core/components/ui/PermissionGuard';
import { usePermissions } from '@/core/hooks/usePermissions';

export default function KpiHseTargetPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [hseTargets, setHseTargets] = useState<HseTarget[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [targetToDelete, setTargetToDelete] = useState<HseTarget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();

  const filterFields: FilterField[] = [
    {
      id: 'type',
      label: 'Type',
      type: 'select',
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
      type: 'select',
      options: Array.from({ length: 10 }, (_, i) => ({
        label: String(currentYear - i),
        value: String(currentYear - i),
      })),
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
  ];

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
      if (response.meta.page && response.meta.page - 1 !== pageIndex) {
        setPageIndex(response.meta.page - 1);
      }
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

  const handleApplyFilters = (filters: FilterValue[]) => {
    const newActiveFilters: Record<string, { value: any; label: string }> = {};
    filters.forEach((filter) => {
      if (filter.id === 'type') {
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: TYPE_LABELS[filter.value as keyof typeof TYPE_LABELS] || filter.value,
        };
      } else if (filter.id === 'status') {
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: filter.value === 'active' ? 'Active' : 'Inactive',
        };
      } else {
        newActiveFilters[filter.id] = { value: filter.value, label: String(filter.value) };
      }
    });
    setActiveFilters(newActiveFilters);
    setPageIndex(0);
  };

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
        title="KPI HSE Target"
        subtitle="Manage HSE targets for actual vs target comparison"
        actions={
          <PermissionGuard permission="kpi-hse-target:create">
            <ThemeButton onClick={() => navigate('/dashboard/kpi-hse-target/new')}>
              <Plus className="mr-2 h-4 w-4" /> Add Target
            </ThemeButton>
          </PermissionGuard>
        }
      />

      <DataTable
        columns={columns}
        data={hseTargets}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(total / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total,
        }}
        filterFields={filterFields}
        activeFilters={activeFilters}
        onSearch={setSearchTerm}
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
    </>
  );
}
