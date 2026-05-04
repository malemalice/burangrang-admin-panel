import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Eye, Trash2, MoreHorizontal } from 'lucide-react';

import { Button } from '@/core/components/ui/button';
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

import { AuditPeriod, formatPeriodLabel } from '../types/audit-period.types';
import auditPeriodsService from '../services/auditPeriodsService';
import { usePermissions } from '@/core/hooks/usePermissions';

export default function AuditPeriodsPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('audit-period:create');
  const canDelete = hasPermission('audit-period:delete');

  const [periods, setPeriods] = useState<AuditPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);

  const [deleteTarget, setDeleteTarget] = useState<AuditPeriod | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fetchPeriods = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await auditPeriodsService.getAll({ page: pageIndex + 1, limit });
      setPeriods(result.data);
      setTotal(result.total);
    } catch {
      toast.error('Failed to load audit periods.');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit]);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await auditPeriodsService.delete(deleteTarget.id);
      toast.success(`Period ${formatPeriodLabel(deleteTarget.month, deleteTarget.year)} deleted.`);
      fetchPeriods();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete period.');
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const completionCell = (period: AuditPeriod) => {
    const total = period.totalAudits;
    const done = period.completedAudits;
    if (total === 0) return <span className="text-muted-foreground text-sm">—</span>;
    const pct = Math.round((done / total) * 100);
    const color =
      pct === 100
        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
        : pct > 0
        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
        {done}/{total} ({pct}%)
      </span>
    );
  };

  const columns = [
    {
      id: 'period',
      header: 'Period',
      cell: (row: AuditPeriod) => (
        <span className="font-medium">{formatPeriodLabel(row.month, row.year)}</span>
      ),
    },
    {
      id: 'totalAudits',
      header: 'Elements',
      cell: (row: AuditPeriod) => <span>{row.totalAudits}</span>,
    },
    {
      id: 'completedAudits',
      header: 'Completed',
      cell: completionCell,
    },
    {
      id: 'creator',
      header: 'Created By',
      cell: (row: AuditPeriod) => (
        <span>{row.creator ? `${row.creator.firstName} ${row.creator.lastName}` : '—'}</span>
      ),
    },
    {
      id: 'createdAt',
      header: 'Created At',
      cell: (row: AuditPeriod) => (
        <span>
          {new Date(row.createdAt).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row: AuditPeriod) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/audit-periods/${row.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              View Detail
            </DropdownMenuItem>
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => {
                    setDeleteTarget(row);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Audit Periods"
        subtitle="Manage monthly audit periods. Each period auto-generates schedules for all active audit elements."
        actions={
          canCreate ? (
            <Button onClick={() => navigate('/audit-periods/new')}>
              <Plus className="mr-2 h-4 w-4" />
              New Audit Period
            </Button>
          ) : undefined
        }
      />

      <DataTable
        columns={columns}
        data={periods}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(total / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total,
        }}
        hideSearch
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialogOpen(false);
            setDeleteTarget(null);
          }
        }}
        title="Delete Audit Period"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${formatPeriodLabel(deleteTarget.month, deleteTarget.year)}"? All unfilled audit schedules in this period will also be deleted.`
            : ''
        }
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </>
  );
}
