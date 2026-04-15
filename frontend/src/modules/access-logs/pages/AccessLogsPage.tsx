import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import DataTable from '@/core/components/ui/data-table/DataTable';
import PageHeader from '@/core/components/ui/PageHeader';
import { PermissionGuard } from '@/core/components/ui/PermissionGuard';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import accessLogService from '../services/accessLogService';
import type { AccessLog, AccessLogStatistics } from '../types/access-log.types';
import { format } from 'date-fns';
import userService from '@/modules/users/services/userService';

const coerceDate = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
};

const AccessLogsPage = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [sorting, setSorting] = useState<{ id: string; desc: boolean } | null>({
    id: 'createdAt',
    desc: true,
  });
  const [activeFilters, setActiveFilters] = useState<
    Record<string, { value: string | string[] | { from?: Date; to?: Date } | boolean; label: string }>
  >({});
  const [statistics, setStatistics] = useState<AccessLogStatistics | null>(null);
  const [userOptions, setUserOptions] = useState<{ label: string; value: string }[]>([]);

  const filterFields: FilterField[] = [
    { id: 'dateRange', label: 'DateTime range', type: 'dateRange' },
    { id: 'userId', label: 'User', type: 'searchableSelect', options: userOptions },
    { id: 'endpoint', label: 'Endpoint', type: 'text', placeholder: 'Filter by path' },
    { id: 'payloadSearch', label: 'Payload', type: 'text', placeholder: 'Search in payload' },
  ];

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const dateRange = activeFilters.dateRange?.value as
        | { from?: Date | string | number; to?: Date | string | number }
        | undefined;
      const dateFrom = coerceDate(dateRange?.from);
      const dateTo = coerceDate(dateRange?.to);
      const params = {
        page: pageIndex + 1,
        limit,
        sortBy: sorting?.id ?? 'createdAt',
        sortOrder: (sorting?.desc ? 'desc' : 'asc') as 'asc' | 'desc',
        userId: activeFilters.userId?.value as string | undefined,
        endpoint: activeFilters.endpoint?.value as string | undefined,
        dateFrom: dateFrom?.toISOString(),
        dateTo: dateTo?.toISOString(),
        payloadSearch: activeFilters.payloadSearch?.value as string | undefined,
      };
      const response = await accessLogService.getAccessLogs(params);
      setLogs(response.data);
      setTotal(response.meta.total);
      if (response.meta.page && response.meta.page - 1 !== pageIndex) {
        setPageIndex(response.meta.page - 1);
      }
    } catch (error) {
      console.error('Failed to fetch access logs:', error);
      toast.error('Failed to load access logs');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, sorting, activeFilters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const fetchStatistics = useCallback(async () => {
    try {
      const stats = await accessLogService.getStatistics();
      setStatistics(stats);
    } catch {
      // Non-blocking; list still works
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  useEffect(() => {
    const loadUserOptions = async () => {
      try {
        const res = await userService.getUsers({ page: 1, limit: 200, options: true });
        setUserOptions(
          res.data.map((u) => ({
            label: u.name || u.email || u.id,
            value: u.id,
          }))
        );
      } catch {
        // Non-blocking; filter still works with empty options
      }
    };
    loadUserOptions();
  }, []);

  const handleApplyFilters = (filters: FilterValue[]) => {
    const newActiveFilters: Record<
      string,
      {
        value:
          | string
          | string[]
          | { from?: Date | string | number; to?: Date | string | number }
          | boolean;
        label: string;
      }
    > = {};
    filters.forEach((filter) => {
      if (filter.id === 'dateRange' && typeof filter.value === 'object' && filter.value !== null && 'from' in filter.value) {
        const range = filter.value as {
          from?: Date | string | number;
          to?: Date | string | number;
        };
        const from = coerceDate(range.from);
        const to = coerceDate(range.to);
        const fmt = (d: Date) => format(d, 'PP p');
        const label =
          from && to
            ? `${fmt(from)} – ${fmt(to)}`
            : from
              ? `From ${fmt(from)}`
              : to
                ? `Until ${fmt(to)}`
                : 'DateTime range';
        newActiveFilters[filter.id] = { value: { from, to }, label };
      } else if (filter.id === 'userId') {
        const opt = userOptions.find((o) => o.value === filter.value);
        newActiveFilters[filter.id] = {
          value: filter.value as string,
          label: opt?.label ?? String(filter.value),
        };
      } else if (filter.id === 'payloadSearch') {
        const val = String(filter.value);
        newActiveFilters[filter.id] = {
          value: val,
          label: val.length > 20 ? `Payload: ${val.slice(0, 20)}…` : `Payload: ${val}`,
        };
      } else {
        newActiveFilters[filter.id] = {
          value: filter.value as string,
          label: String(filter.value),
        };
      }
    });
    setActiveFilters(newActiveFilters);
    setPageIndex(0);
  };

  const formatUser = (log: AccessLog) => {
    if (log.user) {
      const name = [log.user.firstName, log.user.lastName].filter(Boolean).join(' ');
      return name || log.user.email || log.userId || '—';
    }
    return log.userId || '—';
  };

  const payloadPreview = (payload: Record<string, unknown> | undefined) => {
    if (!payload || Object.keys(payload).length === 0) return '—';
    try {
      const s = JSON.stringify(payload);
      return s.length > 80 ? `${s.slice(0, 80)}…` : s;
    } catch {
      return '—';
    }
  };

  const columns = [
    {
      id: 'createdAt',
      header: 'DateTime',
      cell: (log: AccessLog) => (
        <span className="text-muted-foreground text-sm">
          {log.createdAt ? format(new Date(log.createdAt), 'PPp') : '—'}
        </span>
      ),
      isSortable: true,
    },
    {
      id: 'user',
      header: 'User',
      cell: (log: AccessLog) => <span className="text-sm">{formatUser(log)}</span>,
      isSortable: false,
    },
    {
      id: 'endpoint',
      header: 'Endpoint',
      cell: (log: AccessLog) => (
        <span className="text-sm truncate max-w-[200px] block" title={log.endpoint}>
          {log.endpoint}
        </span>
      ),
      isSortable: true,
    },
    {
      id: 'method',
      header: 'Method',
      cell: (log: AccessLog) => (
        <span className="font-mono text-sm font-medium">{log.method}</span>
      ),
      isSortable: true,
    },
    {
      id: 'payload',
      header: 'Payload',
      cell: (log: AccessLog) => (
        <span
          className="text-muted-foreground text-sm truncate max-w-[180px] block font-mono"
          title={
            log.payload && Object.keys(log.payload).length > 0
              ? JSON.stringify(log.payload)
              : undefined
          }
        >
          {payloadPreview(log.payload)}
        </span>
      ),
      isSortable: false,
    },
    {
      id: 'actions',
      header: '',
      cell: (log: AccessLog) => (
        <PermissionGuard permission="access-log:read">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/access-logs/${log.id}`)}
          >
            <Eye className="h-4 w-4 mr-1" /> View
          </Button>
        </PermissionGuard>
      ),
      isSortable: false,
    },
  ];

  return (
    <PermissionGuard
      permission="access-log:list"
      fallback={
        <div className="rounded-lg border border-border bg-card p-6 text-center text-muted-foreground">
          You don&apos;t have access to view access logs.
        </div>
      }
    >
      <PageHeader
        title="Access Logs"
        subtitle="Read-only audit log of API endpoint access (Super Admin only)."
      />

      {statistics && (
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{statistics.total.toLocaleString()}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Last 24h
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{statistics.recentCount.toLocaleString()}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                By method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                {Object.entries(statistics.byMethod)
                  .slice(0, 3)
                  .map(([method, count]) => (
                    <div key={method} className="flex justify-between">
                      <span className="font-mono">{method}</span>
                      <span>{count.toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Top endpoint
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statistics.topEndpoints[0] ? (
                <span className="text-sm font-mono truncate block" title={statistics.topEndpoints[0].endpoint}>
                  {statistics.topEndpoints[0].endpoint}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
              {statistics.topEndpoints[0] && (
                <span className="text-muted-foreground text-xs block mt-1">
                  {statistics.topEndpoints[0].count.toLocaleString()} hits
                </span>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <DataTable
        columns={columns}
        data={logs}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(total / limit) || 1,
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total,
        }}
        filterFields={filterFields}
        activeFilters={activeFilters}
        onApplyFilters={handleApplyFilters}
        sorting={sorting}
        onSortingChange={setSorting}
        hideSearch
        wrapperClassName="max-w-full"
      />
    </PermissionGuard>
  );
};

export default AccessLogsPage;
