import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { BarChart3, CalendarRange, FileDown } from 'lucide-react';

import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/core/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';

import { generateTableAwarePdf, buildPdfOptions } from '@/core/lib/pdfExport';
import auditReportService from '../services/auditReportService';
import {
  AuditReport,
  AuditReportCriteriaGroup,
  AuditReportCriteriaInfo,
  AuditPeriodOption,
} from '../types/audit-report.types';
import { StatusBadge, buildDetailGroups, compliancePercent } from '../utils/audit-report.utils';
import { AuditReportSummaryPDFTemplate } from '../components/AuditReportSummaryPDFTemplate';
import { AuditReportDetailPDFTemplate } from '../components/AuditReportDetailPDFTemplate';

// ─── helpers ────────────────────────────────────────────────────────────────

const formatPeriodLabel = (month: number, year: number): string =>
  format(new Date(year, month - 1, 1), 'MMMM yyyy');

// ─── CriteriaPopoverCell ─────────────────────────────────────────────────────

interface CriteriaPopoverCellProps {
  count: number;
  items: AuditReportCriteriaInfo[];
  colorClass: string;
  label: string;
}

const CriteriaPopoverCell = ({ count, items, colorClass, label }: CriteriaPopoverCellProps) => {
  const [open, setOpen] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    if (count > 0) setOpen(true);
  };

  const handleMouseLeave = () => {
    leaveTimer.current = setTimeout(() => setOpen(false), 120);
  };

  const handleContentMouseEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
  };

  const handleContentMouseLeave = () => {
    leaveTimer.current = setTimeout(() => setOpen(false), 120);
  };

  const handleClick = () => {
    if (count > 0) setOpen((prev) => !prev);
  };

  if (count === 0) {
    return (
      <TableCell className="text-center tabular-nums text-xs text-muted-foreground px-2 py-2">
        —
      </TableCell>
    );
  }

  return (
    <TableCell className={`text-center tabular-nums text-xs font-medium px-2 py-2 ${colorClass}`}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-full h-full cursor-pointer underline-offset-2 hover:underline focus:outline-none"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            aria-label={`${count} ${label} criteria — click to see list`}
          >
            {count}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[420px] p-0"
          side="right"
          align="start"
          sideOffset={8}
          onMouseEnter={handleContentMouseEnter}
          onMouseLeave={handleContentMouseLeave}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="px-3 py-2 border-b bg-muted/40">
            <p className="text-xs font-semibold text-foreground">
              {count} {label} {count === 1 ? 'Criterion' : 'Criteria'}
            </p>
          </div>
          <div className="overflow-y-auto max-h-72">
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.criteriaId} className="px-3 py-2.5 space-y-0.5">
                  <div className="flex items-start gap-1.5">
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0 mt-0.5">
                      {item.criteriaCode}
                    </span>
                    <span className="text-[11px] font-medium text-foreground leading-snug">
                      {item.clauseName}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug pl-0">
                    {item.criteriaName}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </PopoverContent>
      </Popover>
    </TableCell>
  );
};

// ─── GroupCells ──────────────────────────────────────────────────────────────

interface GroupCellsProps {
  group: AuditReportCriteriaGroup;
  borderRight?: boolean;
}

const GroupCells = ({ group, borderRight = false }: GroupCellsProps) => (
  <>
    <CriteriaPopoverCell
      count={group.comply}
      items={group.complyItems}
      colorClass="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
      label="Comply"
    />
    <CriteriaPopoverCell
      count={group.notComplyMinor}
      items={group.notComplyMinorItems}
      colorClass="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"
      label="Minor Non-Comply"
    />
    <CriteriaPopoverCell
      count={group.notComplyMajor}
      items={group.notComplyMajorItems}
      colorClass="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
      label="Major Non-Comply"
    />
    <TableCell
      className={`text-center text-xs text-muted-foreground px-2 py-2${borderRight ? ' border-r' : ''}`}
    >
      {group.notAssessed === group.total ? '—' : group.total - group.notAssessed}
    </TableCell>
  </>
);

// ─── SummaryCard ─────────────────────────────────────────────────────────────

const SummaryCard = ({
  title,
  group,
}: {
  title: string;
  group: AuditReportCriteriaGroup;
}) => {
  const pct = compliancePercent(group);
  const assessed = group.total - group.notAssessed;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{pct}%</div>
        <p className="text-xs text-muted-foreground mt-1">
          {group.comply} comply / {assessed} assessed / {group.total} total
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

// ─── LoadingSpinner ───────────────────────────────────────────────────────────

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-24">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const AuditReportPage = () => {
  const [periods, setPeriods] = useState<AuditPeriodOption[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | undefined>(undefined);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPeriodsLoading, setIsPeriodsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'summary' | 'detail'>('summary');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const summaryPdfRef = useRef<HTMLDivElement>(null);
  const detailPdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPeriods = async () => {
      setIsPeriodsLoading(true);
      try {
        const data = await auditReportService.getPeriods();
        setPeriods(data);
        if (data.length > 0) setSelectedPeriodId(data[0].id);
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
    if (selectedPeriodId) fetchReport(selectedPeriodId);
  }, [selectedPeriodId, fetchReport]);

  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId);
  const selectedPeriodLabel = selectedPeriod
    ? formatPeriodLabel(selectedPeriod.month, selectedPeriod.year)
    : '';

  const handleExportPDF = async () => {
    if (!report) return;
    setIsExportingPDF(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const ref = viewMode === 'summary' ? summaryPdfRef : detailPdfRef;
      const orientation = viewMode === 'summary' ? 'landscape' : 'portrait';
      await generateTableAwarePdf(ref, buildPdfOptions({ page: { orientation } }));
      toast.success('PDF exported successfully');
    } catch {
      toast.error('Failed to export PDF');
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Audit Report"
        subtitle="Summary of criteria compliance grouped by transition level"
      />

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'summary' | 'detail')}>
        {/* Toolbar: period filter + view toggle + export — all on one row */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
            <CalendarRange className="h-4 w-4" />
            <span>Audit Period</span>
          </div>
          <Select
            value={selectedPeriodId ?? ''}
            onValueChange={setSelectedPeriodId}
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

          <div className="ml-auto flex items-center gap-2">
            <TabsList>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="detail">Detail</TabsTrigger>
            </TabsList>
            <Button
              onClick={handleExportPDF}
              disabled={!report || isLoading || isExportingPDF}
              variant="outline"
              size="sm"
            >
              <FileDown className="mr-2 h-4 w-4" />
              {isExportingPDF ? 'Exporting...' : 'Export PDF'}
            </Button>
          </div>
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
            <SummaryCard title="Initial Level" group={report.summary.initial} />
            <SummaryCard title="Transition Level" group={report.summary.transitionLevel} />
            <SummaryCard title="Advance Level" group={report.summary.advanceLevel} />
          </div>
        ) : null}

        {/* ── Summary tab: matrix ── */}
        <TabsContent value="summary">
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
                  <TableHead className="text-center text-[10px] bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-2 py-1">Comply</TableHead>
                  <TableHead className="text-center text-[10px] bg-green-50 dark:bg-green-950/30 text-yellow-700 dark:text-yellow-400 px-2 py-1">Minor</TableHead>
                  <TableHead className="text-center text-[10px] bg-green-50 dark:bg-green-950/30 text-red-700 dark:text-red-400 px-2 py-1">Major</TableHead>
                  <TableHead className="text-center text-[10px] bg-green-50 dark:bg-green-950/30 text-muted-foreground border-r px-2 py-1">Total</TableHead>
                  <TableHead className="text-center text-[10px] bg-yellow-50 dark:bg-yellow-950/30 text-green-700 dark:text-green-400 px-2 py-1">Comply</TableHead>
                  <TableHead className="text-center text-[10px] bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 px-2 py-1">Minor</TableHead>
                  <TableHead className="text-center text-[10px] bg-yellow-50 dark:bg-yellow-950/30 text-red-700 dark:text-red-400 px-2 py-1">Major</TableHead>
                  <TableHead className="text-center text-[10px] bg-yellow-50 dark:bg-yellow-950/30 text-muted-foreground border-r px-2 py-1">Total</TableHead>
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
                        <GroupCells group={el.initial} borderRight />
                        <GroupCells group={el.transitionLevel} borderRight />
                        <GroupCells group={el.advanceLevel} />
                      </TableRow>
                    ))}

                    {report.summary && (
                      <TableRow className="bg-muted/40 border-t-2">
                        <TableCell className="text-center border-r sticky left-0 bg-muted/40 z-10" />
                        <TableCell className="text-xs border-r sticky left-8 bg-muted/40 z-10 font-semibold">
                          Total
                        </TableCell>
                        <TableCell className="text-center text-xs text-green-800 dark:text-green-300 font-semibold px-2 py-2">{report.summary.initial.comply}</TableCell>
                        <TableCell className="text-center text-xs text-yellow-800 dark:text-yellow-300 font-semibold px-2 py-2">{report.summary.initial.notComplyMinor}</TableCell>
                        <TableCell className="text-center text-xs text-red-800 dark:text-red-300 font-semibold px-2 py-2">{report.summary.initial.notComplyMajor}</TableCell>
                        <TableCell className="text-center text-xs text-muted-foreground border-r px-2 py-2">{report.summary.initial.total - report.summary.initial.notAssessed}</TableCell>
                        <TableCell className="text-center text-xs text-green-800 dark:text-green-300 font-semibold px-2 py-2">{report.summary.transitionLevel.comply}</TableCell>
                        <TableCell className="text-center text-xs text-yellow-800 dark:text-yellow-300 font-semibold px-2 py-2">{report.summary.transitionLevel.notComplyMinor}</TableCell>
                        <TableCell className="text-center text-xs text-red-800 dark:text-red-300 font-semibold px-2 py-2">{report.summary.transitionLevel.notComplyMajor}</TableCell>
                        <TableCell className="text-center text-xs text-muted-foreground border-r px-2 py-2">{report.summary.transitionLevel.total - report.summary.transitionLevel.notAssessed}</TableCell>
                        <TableCell className="text-center text-xs text-green-800 dark:text-green-300 font-semibold px-2 py-2">{report.summary.advanceLevel.comply}</TableCell>
                        <TableCell className="text-center text-xs text-yellow-800 dark:text-yellow-300 font-semibold px-2 py-2">{report.summary.advanceLevel.notComplyMinor}</TableCell>
                        <TableCell className="text-center text-xs text-red-800 dark:text-red-300 font-semibold px-2 py-2">{report.summary.advanceLevel.notComplyMajor}</TableCell>
                        <TableCell className="text-center text-xs text-muted-foreground px-2 py-2">{report.summary.advanceLevel.total - report.summary.advanceLevel.notAssessed}</TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Hover or tap a number to see the list of criteria in that category.
          </p>
        </TabsContent>

        {/* ── Detail tab: per-criteria rows grouped by element ── */}
        <TabsContent value="detail">
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead rowSpan={2} className="w-8 text-center border-r sticky left-0 bg-background z-20 align-middle text-xs">
                    No.
                  </TableHead>
                  <TableHead rowSpan={2} className="min-w-[300px] border-r sticky left-8 bg-background z-20 align-middle text-xs">
                    Criteria
                  </TableHead>
                  <TableHead className="text-center border-r text-xs bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 font-semibold">
                    Initial Level (Tingkatan Awal)
                  </TableHead>
                  <TableHead className="text-center border-r text-xs bg-yellow-50 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-300 font-semibold">
                    Transition Level (Tingkatan Transisi)
                  </TableHead>
                  <TableHead className="text-center text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 font-semibold">
                    Advance Level (Tingkatan Lanjutan)
                  </TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="text-center text-[10px] bg-green-50 dark:bg-green-950/30 text-muted-foreground border-r px-2 py-1 w-36">Status</TableHead>
                  <TableHead className="text-center text-[10px] bg-yellow-50 dark:bg-yellow-950/30 text-muted-foreground border-r px-2 py-1 w-36">Status</TableHead>
                  <TableHead className="text-center text-[10px] bg-blue-50 dark:bg-blue-950/30 text-muted-foreground px-2 py-1 w-36">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12">
                      <LoadingSpinner />
                    </TableCell>
                  </TableRow>
                ) : !report || report.elements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                      No data available for this period.
                    </TableCell>
                  </TableRow>
                ) : (() => {
                  const groups = buildDetailGroups(report);
                  let elementIndex = 0;
                  return groups.map((group) => {
                    if (group.rows.length === 0) return null;
                    elementIndex += 1;
                    return (
                      <React.Fragment key={group.elementId}>
                        {/* Element section header */}
                        <TableRow className="bg-muted/60 border-t">
                          <TableCell className="text-center text-xs border-r sticky left-0 bg-muted/60 z-10 font-semibold">
                            {elementIndex}
                          </TableCell>
                          <TableCell colSpan={4} className="py-1.5 px-3">
                            <span className="font-mono text-[10px] text-muted-foreground mr-1.5">{group.elementCode}</span>
                            <span className="text-xs font-semibold text-foreground">{group.elementName}</span>
                            {!group.hasAudit && (
                              <span className="ml-2 text-[10px] text-muted-foreground italic">No audit this period</span>
                            )}
                          </TableCell>
                        </TableRow>

                        {/* Criteria rows */}
                        {group.rows.map((row) => (
                          <TableRow key={row.key} className="hover:bg-muted/30">
                            <TableCell className="border-r sticky left-0 bg-background z-10" />
                            <TableCell className="border-r sticky left-8 bg-background z-10 py-2.5">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="font-mono text-[10px] font-semibold text-foreground bg-muted px-1 py-0.5 rounded">
                                  {row.criteriaCode}
                                </span>
                                <span className="text-[10px] text-muted-foreground">{row.clauseCode} · {row.clauseName}</span>
                              </div>
                              <div className="text-xs text-foreground leading-snug">{row.criteriaName}</div>
                              {row.criteriaDescription && (
                                <div className="text-[10px] text-muted-foreground leading-snug mt-0.5 italic">
                                  {row.criteriaDescription}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-center px-2 py-2 border-r">
                              <StatusBadge status={row.initial} />
                            </TableCell>
                            <TableCell className="text-center px-2 py-2 border-r">
                              <StatusBadge status={row.transitionLevel} />
                            </TableCell>
                            <TableCell className="text-center px-2 py-2">
                              <StatusBadge status={row.advanceLevel} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    );
                  });
                })()}
              </TableBody>
            </Table>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            One row per criteria. Each level column shows the compliance status for that criteria.
          </p>
        </TabsContent>
      </Tabs>

      {/* Hidden PDF containers */}
      {report && (
        <>
          <div
            ref={summaryPdfRef}
            style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '297mm' }}
            aria-hidden="true"
          >
            <AuditReportSummaryPDFTemplate report={report} periodLabel={selectedPeriodLabel} />
          </div>
          <div
            ref={detailPdfRef}
            style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '210mm' }}
            aria-hidden="true"
          >
            <AuditReportDetailPDFTemplate report={report} periodLabel={selectedPeriodLabel} />
          </div>
        </>
      )}
    </>
  );
};

export default AuditReportPage;
