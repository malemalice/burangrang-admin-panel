import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { BarChart3, CalendarRange } from 'lucide-react';

import PageHeader from '@/core/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';

import auditReportService from '../services/auditReportService';
import {
  AuditReport,
  AuditReportCriteriaGroup,
  AuditPeriodOption,
} from '../types/audit-report.types';

const formatPeriodLabel = (month: number, year: number): string => {
  return format(new Date(year, month - 1, 1), 'MMMM yyyy');
};

const compliancePercent = (group: AuditReportCriteriaGroup): number => {
  const assessed = group.total - group.notAssessed;
  if (assessed === 0) return 0;
  return Math.round((group.comply / assessed) * 100);
};

const cellClass = (group: AuditReportCriteriaGroup, subKey: keyof AuditReportCriteriaGroup): string => {
  const base = 'text-center tabular-nums text-xs font-medium px-2 py-2';
  if (group.total === 0) return `${base} text-muted-foreground`;
  if (subKey === 'comply' && group.comply > 0) return `${base} bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300`;
  if (subKey === 'notComplyMinor' && group.notComplyMinor > 0) return `${base} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300`;
  if (subKey === 'notComplyMajor' && group.notComplyMajor > 0) return `${base} bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300`;
  if (subKey === 'notAssessed' && group.notAssessed > 0) return `${base} text-muted-foreground`;
  return `${base} text-muted-foreground`;
};

const SummaryCard = ({
  title,
  group,
  icon,
}: {
  title: string;
  group: AuditReportCriteriaGroup;
  icon: React.ReactNode;
}) => {
  const pct = compliancePercent(group);
  const assessed = group.total - group.notAssessed;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{pct}%</div>
        <p className="text-xs text-muted-foreground mt-1">
          {group.comply} comply / {assessed} assessed / {group.total} total criteria
        </p>
        <div className="flex gap-2 mt-2 text-xs">
          <span className="text-yellow-700 dark:text-yellow-400">{group.notComplyMinor} minor</span>
          <span className="text-red-700 dark:text-red-400">{group.notComplyMajor} major</span>
          <span className="text-muted-foreground">{group.notAssessed} not assessed</span>
        </div>
      </CardContent>
    </Card>
  );
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-24">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
  </div>
);

const AuditReportPage = () => {
  const [periods, setPeriods] = useState<AuditPeriodOption[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | undefined>(undefined);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPeriodsLoading, setIsPeriodsLoading] = useState(true);

  // Fetch periods on mount and auto-select the most recent one
  useEffect(() => {
    const fetchPeriods = async () => {
      setIsPeriodsLoading(true);
      try {
        const data = await auditReportService.getPeriods();
        setPeriods(data);
        if (data.length > 0) {
          setSelectedPeriodId(data[0].id);
        }
      } catch {
        toast.error('Failed to load audit periods');
      } finally {
        setIsPeriodsLoading(false);
      }
    };
    fetchPeriods();
  }, []);

  const fetchReport = useCallback(async (periodId: string) => {
    setIsLoading(true);
    try {
      const data = await auditReportService.getReport(periodId);
      setReport(data);
    } catch {
      toast.error('Failed to load audit report');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPeriodId) {
      fetchReport(selectedPeriodId);
    }
  }, [selectedPeriodId, fetchReport]);

  const handlePeriodChange = (value: string) => {
    setSelectedPeriodId(value);
  };

  return (
    <>
      <PageHeader
        title="Audit Report"
        subtitle="Summary of criteria compliance grouped by transition level"
      />

      {/* Period filter */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarRange className="h-4 w-4" />
          <span>Audit Period</span>
        </div>
        <Select
          value={selectedPeriodId ?? ''}
          onValueChange={handlePeriodChange}
          disabled={isPeriodsLoading}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select period..." />
          </SelectTrigger>
          <SelectContent>
            {periods.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {formatPeriodLabel(p.month, p.year)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="flex items-center justify-center h-28">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : report ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <SummaryCard
            title="Initial Level"
            group={report.summary.initial}
            icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
          />
          <SummaryCard
            title="Transition Level"
            group={report.summary.transitionLevel}
            icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
          />
          <SummaryCard
            title="Advance Level"
            group={report.summary.advanceLevel}
            icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
          />
        </div>
      ) : null}

      {/* Matrix table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead rowSpan={2} className="w-8 text-center border-r sticky left-0 bg-background z-20 align-middle text-xs">
                No.
              </TableHead>
              <TableHead rowSpan={2} className="min-w-[220px] border-r sticky left-8 bg-background z-20 align-middle text-xs">
                Element
              </TableHead>
              <TableHead colSpan={4} className="text-center border-r text-xs bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 font-semibold">
                Initial Level (Tingkatan Awal)
              </TableHead>
              <TableHead colSpan={4} className="text-center border-r text-xs bg-yellow-50 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-300 font-semibold">
                Transition Level (Tingkatan Transisi)
              </TableHead>
              <TableHead colSpan={4} className="text-center text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-semibold">
                Advance Level (Tingkatan Lanjutan)
              </TableHead>
            </TableRow>
            <TableRow className="text-xs">
              {/* Initial sub-cols */}
              <TableHead className="text-center text-[10px] bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-2 py-1">Comply</TableHead>
              <TableHead className="text-center text-[10px] bg-green-50 dark:bg-green-950/30 text-yellow-700 dark:text-yellow-400 px-2 py-1">Minor</TableHead>
              <TableHead className="text-center text-[10px] bg-green-50 dark:bg-green-950/30 text-red-700 dark:text-red-400 px-2 py-1">Major</TableHead>
              <TableHead className="text-center text-[10px] bg-green-50 dark:bg-green-950/30 text-muted-foreground border-r px-2 py-1">Total</TableHead>
              {/* Transition sub-cols */}
              <TableHead className="text-center text-[10px] bg-yellow-50 dark:bg-yellow-950/30 text-green-700 dark:text-green-400 px-2 py-1">Comply</TableHead>
              <TableHead className="text-center text-[10px] bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 px-2 py-1">Minor</TableHead>
              <TableHead className="text-center text-[10px] bg-yellow-50 dark:bg-yellow-950/30 text-red-700 dark:text-red-400 px-2 py-1">Major</TableHead>
              <TableHead className="text-center text-[10px] bg-yellow-50 dark:bg-yellow-950/30 text-muted-foreground border-r px-2 py-1">Total</TableHead>
              {/* Advance sub-cols */}
              <TableHead className="text-center text-[10px] bg-blue-50 dark:bg-blue-950/30 text-green-700 dark:text-green-400 px-2 py-1">Comply</TableHead>
              <TableHead className="text-center text-[10px] bg-blue-50 dark:bg-blue-950/30 text-yellow-700 dark:text-yellow-400 px-2 py-1">Minor</TableHead>
              <TableHead className="text-center text-[10px] bg-blue-50 dark:bg-blue-950/30 text-red-700 dark:text-red-400 px-2 py-1">Major</TableHead>
              <TableHead className="text-center text-[10px] bg-blue-50 dark:bg-blue-950/30 text-muted-foreground px-2 py-1">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={14} className="py-12">
                  <LoadingSpinner />
                </TableCell>
              </TableRow>
            ) : !report || report.elements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={14} className="text-center text-sm text-muted-foreground py-8">
                  No data available for this period.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {report.elements.map((el, idx) => (
                  <TableRow key={el.elementId} className="hover:bg-muted/30">
                    <TableCell className="text-center text-xs border-r sticky left-0 bg-background z-10 font-medium">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="text-xs border-r sticky left-8 bg-background z-10">
                      <div className="font-medium leading-tight">
                        <span className="font-mono text-[10px] text-muted-foreground mr-1">{el.elementCode}</span>
                        {el.elementName}
                      </div>
                      {!el.hasAudit && (
                        <span className="text-[10px] text-muted-foreground italic">No audit this period</span>
                      )}
                    </TableCell>

                    {/* Initial */}
                    <TableCell className={cellClass(el.initial, 'comply')}>{el.initial.comply || '—'}</TableCell>
                    <TableCell className={cellClass(el.initial, 'notComplyMinor')}>{el.initial.notComplyMinor || '—'}</TableCell>
                    <TableCell className={cellClass(el.initial, 'notComplyMajor')}>{el.initial.notComplyMajor || '—'}</TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground border-r px-2 py-2">{el.initial.total}</TableCell>

                    {/* Transition */}
                    <TableCell className={cellClass(el.transitionLevel, 'comply')}>{el.transitionLevel.comply || '—'}</TableCell>
                    <TableCell className={cellClass(el.transitionLevel, 'notComplyMinor')}>{el.transitionLevel.notComplyMinor || '—'}</TableCell>
                    <TableCell className={cellClass(el.transitionLevel, 'notComplyMajor')}>{el.transitionLevel.notComplyMajor || '—'}</TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground border-r px-2 py-2">{el.transitionLevel.total}</TableCell>

                    {/* Advance */}
                    <TableCell className={cellClass(el.advanceLevel, 'comply')}>{el.advanceLevel.comply || '—'}</TableCell>
                    <TableCell className={cellClass(el.advanceLevel, 'notComplyMinor')}>{el.advanceLevel.notComplyMinor || '—'}</TableCell>
                    <TableCell className={cellClass(el.advanceLevel, 'notComplyMajor')}>{el.advanceLevel.notComplyMajor || '—'}</TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground px-2 py-2">{el.advanceLevel.total}</TableCell>
                  </TableRow>
                ))}

                {/* Summary / totals row */}
                {report.summary && (
                  <TableRow className="bg-muted/40 font-semibold border-t-2">
                    <TableCell className="text-center border-r sticky left-0 bg-muted/40 z-10" />
                    <TableCell className="text-xs border-r sticky left-8 bg-muted/40 z-10 font-semibold">
                      Total
                    </TableCell>
                    {/* Initial totals */}
                    <TableCell className="text-center text-xs text-green-800 dark:text-green-300 font-semibold px-2 py-2">{report.summary.initial.comply}</TableCell>
                    <TableCell className="text-center text-xs text-yellow-800 dark:text-yellow-300 font-semibold px-2 py-2">{report.summary.initial.notComplyMinor}</TableCell>
                    <TableCell className="text-center text-xs text-red-800 dark:text-red-300 font-semibold px-2 py-2">{report.summary.initial.notComplyMajor}</TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground border-r px-2 py-2">{report.summary.initial.total}</TableCell>
                    {/* Transition totals */}
                    <TableCell className="text-center text-xs text-green-800 dark:text-green-300 font-semibold px-2 py-2">{report.summary.transitionLevel.comply}</TableCell>
                    <TableCell className="text-center text-xs text-yellow-800 dark:text-yellow-300 font-semibold px-2 py-2">{report.summary.transitionLevel.notComplyMinor}</TableCell>
                    <TableCell className="text-center text-xs text-red-800 dark:text-red-300 font-semibold px-2 py-2">{report.summary.transitionLevel.notComplyMajor}</TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground border-r px-2 py-2">{report.summary.transitionLevel.total}</TableCell>
                    {/* Advance totals */}
                    <TableCell className="text-center text-xs text-green-800 dark:text-green-300 font-semibold px-2 py-2">{report.summary.advanceLevel.comply}</TableCell>
                    <TableCell className="text-center text-xs text-yellow-800 dark:text-yellow-300 font-semibold px-2 py-2">{report.summary.advanceLevel.notComplyMinor}</TableCell>
                    <TableCell className="text-center text-xs text-red-800 dark:text-red-300 font-semibold px-2 py-2">{report.summary.advanceLevel.notComplyMajor}</TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground px-2 py-2">{report.summary.advanceLevel.total}</TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default AuditReportPage;
