import { useCallback, useEffect, useMemo, useState } from 'react';
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
import type { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<
    Record<string, { value: string; label: string }>
  >({});

  const filterFields: FilterField[] = useMemo(
    () => [
      {
        id: 'participantName',
        label: 'Participant name',
        type: 'text',
        placeholder: 'First name, last name, or email',
      },
    ],
    [],
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const trimmedSearch = searchTerm.trim();
      const participantRaw = activeFilters.participantName?.value;
      const participantName =
        typeof participantRaw === 'string' && participantRaw.trim().length > 0
          ? participantRaw.trim()
          : undefined;
      const res = await healthScreeningService.list({
        page: pageIndex + 1,
        limit,
        search: trimmedSearch.length > 0 ? trimmedSearch : undefined,
        participantName,
      });
      setRows(res.data);
      setTotal(res.meta.total);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load screenings');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, searchTerm, activeFilters]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0);
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    const p = filters.find((f) => f.id === 'participantName');
    const next: Record<string, { value: string; label: string }> = {};
    if (p && typeof p.value === 'string' && p.value.trim()) {
      const v = p.value.trim();
      next.participantName = { value: v, label: `Participant: ${v}` };
    }
    setActiveFilters(next);
    setPageIndex(0);
  };

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

  const participantLabel = (r: HealthScreeningListItem) => {
    if (!r.user) return '—';
    const name = `${r.user.firstName} ${r.user.lastName}`.trim();
    return name || r.user.email;
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
        <div className="font-medium">{r.quiz?.title ?? '—'}</div>
      ),
      isSortable: true,
    },
    {
      id: 'participant',
      header: 'Participant',
      cell: (r: HealthScreeningListItem) => {
        const hasName = r.user && `${r.user.firstName} ${r.user.lastName}`.trim();
        return (
          <div>
            <div className="font-medium">{participantLabel(r)}</div>
            {hasName && r.user?.email ? (
              <div className="text-xs text-muted-foreground">{r.user.email}</div>
            ) : null}
          </div>
        );
      },
      isSortable: true,
    },
    {
      id: 'company',
      header: 'Company',
      cell: (r: HealthScreeningListItem) =>
        r.company?.name ? (
          <span className="text-sm">{r.company.name}</span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
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
      id: 'createdAt',
      header: 'Created at',
      cell: (r: HealthScreeningListItem) => (
        <span className="text-sm">{new Date(r.createdAt).toLocaleString()}</span>
      ),
      isSortable: true,
    },
    {
      id: 'usedFor',
      header: 'Used for',
      cell: (r: HealthScreeningListItem) => {
        if (r.status !== 'DONE') {
          return <span className="text-muted-foreground text-sm">—</span>;
        }
        if (r.consumedByWorkPermitId) {
          return (
            <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
              {r.consumedByWorkPermitCode ?? 'Linked'}
            </span>
          );
        }
        return (
          <span className="inline-flex items-center rounded-md bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
            Available
          </span>
        );
      },
      isSortable: false,
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
        searchValue={searchTerm}
        searchPlaceholder="Search by questionnaire title..."
        onSearch={handleSearch}
        filterFields={filterFields}
        activeFilters={activeFilters}
        onApplyFilters={handleApplyFilters}
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
