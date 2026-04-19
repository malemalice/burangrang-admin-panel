import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Eye, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import DataTable from '@/core/components/ui/data-table/DataTable';
import PageHeader from '@/core/components/ui/PageHeader';
import { PermissionGuard } from '@/core/components/ui/PermissionGuard';
import { usePermissions } from '@/core/hooks/usePermissions';
import healthScreeningService from '../services/healthScreeningService';
import type { HealthScreeningListItem } from '../types/healthScreening.types';
import { useAuth } from '@/core/lib/auth';

const HealthScreeningsPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { user } = useAuth();
  const [rows, setRows] = useState<HealthScreeningListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [starting, setStarting] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await healthScreeningService.list({ page: pageIndex + 1, limit });
      setRows(res.data);
      setTotal(res.meta.total);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load screenings');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStart = async () => {
    if (!hasPermission('health-screening:start')) return;
    setStarting(true);
    try {
      const { screening } = await healthScreeningService.start({});
      toast.success('Declaration started');
      navigate(`/health-screenings/${screening.id}/fill`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not start');
    } finally {
      setStarting(false);
    }
  };

  const statusBadge = (s: HealthScreeningListItem['status']) => {
    switch (s) {
      case 'IN_PROGRESS':
        return <Badge variant="secondary">In progress</Badge>;
      case 'DONE':
        return <Badge className="bg-green-600">Done</Badge>;
      case 'EXPIRED':
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">{String(s)}</Badge>;
    }
  };

  const columns = [
    {
      id: 'quiz',
      header: 'Questionnaire',
      cell: (r: HealthScreeningListItem) => (
        <div>
          <div className="font-medium">{r.quiz?.title ?? '—'}</div>
          <div className="text-xs text-muted-foreground">
            {r.user && r.userId !== user?.id
              ? `${r.user.firstName} ${r.user.lastName}`.trim() || r.user.email
              : null}
          </div>
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (r: HealthScreeningListItem) => statusBadge(r.status),
      isSortable: true,
    },
    {
      id: 'validUntil',
      header: 'Valid until',
      cell: (r: HealthScreeningListItem) =>
        r.validUntil ? (
          <span className="text-sm">{new Date(r.validUntil).toLocaleDateString()}</span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
      isSortable: true,
    },
    {
      id: 'actions',
      header: '',
      cell: (r: HealthScreeningListItem) => (
        <DropdownMenu
          open={openDropdownId === r.id}
          onOpenChange={(open) => setOpenDropdownId(open ? r.id : null)}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {hasPermission('health-screening:read') && (
              <DropdownMenuItem onClick={() => navigate(`/health-screenings/${r.id}`)}>
                <Eye className="mr-2 h-4 w-4" /> View
              </DropdownMenuItem>
            )}
            {r.status === 'IN_PROGRESS' &&
              r.userId === user?.id &&
              hasPermission('health-screening:submit') && (
                <DropdownMenuItem onClick={() => navigate(`/health-screenings/${r.id}/fill`)}>
                  Continue
                </DropdownMenuItem>
              )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      isSortable: false,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Health declarations"
        subtitle="Your screenings and company-visible records (scoped by role)"
        actions={
          <PermissionGuard permission="health-screening:start">
            <Button onClick={handleStart} disabled={starting}>
              <Plus className="mr-2 h-4 w-4" />
              {starting ? 'Starting…' : 'New declaration'}
            </Button>
          </PermissionGuard>
        }
      />
      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(total / limit) || 1,
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total,
        }}
      />
    </div>
  );
};

export default HealthScreeningsPage;
