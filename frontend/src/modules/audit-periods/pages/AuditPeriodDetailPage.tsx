import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Eye, ChevronLeft } from 'lucide-react';

import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import PageHeader from '@/core/components/ui/PageHeader';
import DataTable from '@/core/components/ui/data-table/DataTable';

import { AuditPeriod, formatPeriodLabel, MONTH_NAMES } from '../types/audit-period.types';
import { AuditSchedule } from '@/modules/audit-schedules/types/audit-schedule.types';
import auditPeriodsService from '../services/auditPeriodsService';
import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';

const STATUS_BADGE: Record<string, string> = {
  [GeneralStatusEnum.SCHEDULED]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  [GeneralStatusEnum.OPEN]:      'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  [GeneralStatusEnum.DONE]:      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  [GeneralStatusEnum.DRAFT]:     'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
};

export default function AuditPeriodDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [period, setPeriod] = useState<AuditPeriod | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    auditPeriodsService
      .getById(id)
      .then(setPeriod)
      .catch(() => setError('Failed to load audit period.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (error || !period) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">{error ?? 'Period not found.'}</p>
        <Button variant="outline" onClick={() => navigate('/audit-periods')}>
          Back to Audit Periods
        </Button>
      </div>
    );
  }

  const label = formatPeriodLabel(period.month, period.year);
  const audits: AuditSchedule[] = period.audits ?? [];

  const columns = [
    {
      id: 'auditElement',
      header: 'Audit Element',
      cell: (row: AuditSchedule) => (
        <span className="font-medium">{row.auditElement?.name ?? '—'}</span>
      ),
    },
    {
      id: 'code',
      header: 'Code',
      cell: (row: AuditSchedule) => (
        <span className="font-mono text-xs text-muted-foreground">{row.code}</span>
      ),
    },
    {
      id: 'areas',
      header: 'Areas',
      cell: (row: AuditSchedule) => {
        const areas = row.areas ?? [];
        if (areas.length === 0) return <span className="text-muted-foreground text-sm">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {areas.slice(0, 2).map((a) => (
              <Badge key={a.id} variant="secondary" className="text-xs">
                {a.name}
              </Badge>
            ))}
            {areas.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{areas.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'auditors',
      header: 'Auditors',
      cell: (row: AuditSchedule) => {
        const auditors = row.auditors ?? [];
        if (auditors.length === 0) return <span className="text-muted-foreground text-sm">—</span>;
        return (
          <span className="text-sm">
            {auditors.map((u) => `${u.firstName} ${u.lastName}`).join(', ')}
          </span>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row: AuditSchedule) => {
        const cls = STATUS_BADGE[row.status] ?? STATUS_BADGE[GeneralStatusEnum.DRAFT];
        return (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
            {row.status}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: (row: AuditSchedule) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/audit-schedules/${row.id}`)}
        >
          <Eye className="mr-1 h-4 w-4" />
          View
        </Button>
      ),
    },
  ];

  const completionPct =
    period.totalAudits > 0
      ? Math.round((period.completedAudits / period.totalAudits) * 100)
      : 0;

  return (
    <>
      <div className="mb-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Audit Periods
        </Button>
      </div>
      <PageHeader
        title={label}
        subtitle={`Audit period — ${period.totalAudits} element schedule${period.totalAudits !== 1 ? 's' : ''}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Period Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Month</span>
              <span className="font-medium">{MONTH_NAMES[period.month - 1]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Year</span>
              <span className="font-medium">{period.year}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created By</span>
              <span className="font-medium">
                {period.creator ? `${period.creator.firstName} ${period.creator.lastName}` : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created At</span>
              <span className="font-medium">
                {format(new Date(period.createdAt), 'd MMM yyyy')}
              </span>
            </div>
            {period.notes && (
              <div className="pt-2 border-t border-border">
                <p className="text-muted-foreground text-xs mb-1">Notes</p>
                <p>{period.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Elements</span>
              <span className="font-medium">{period.totalAudits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Completed (DONE)</span>
              <span className="font-medium">{period.completedAudits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">In Progress</span>
              <span className="font-medium">{period.totalAudits - period.completedAudits}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Overall Progress</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
                <span className="font-medium text-xs">{completionPct}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={audits}
        isLoading={false}
        hideSearch
      />
    </>
  );
}
