import { useState, useCallback } from 'react';
import { Button } from '@/core/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import { RotateCcw } from 'lucide-react';

export interface PeriodRangeFilterProps {
  periodFrom: string | undefined;
  periodTo: string | undefined;
  onPeriodFromChange: (value: string | undefined) => void;
  onPeriodToChange: (value: string | undefined) => void;
  onApply: () => void;
  onReset: () => void;
  monthOptions: { value: number; label: string }[];
  yearOptions: { value: number; label: string }[];
}

function parsePeriod(period: string | undefined): { month: number; year: number } | null {
  if (!period) return null;
  const [y, m] = period.split('-').map(Number);
  if (!y || !m) return null;
  return { month: m, year: y };
}

function toPeriod(month: number, year: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** Returns an error message when both are set and From > To; otherwise null. */
export function getPeriodRangeValidationError(
  periodFrom: string | undefined,
  periodTo: string | undefined,
): string | null {
  if (!periodFrom || !periodTo) return null;
  if (periodFrom > periodTo) {
    return 'From date must be before or equal to To date.';
  }
  return null;
}

/**
 * Format period filter for display. Returns "All periods" when neither is set.
 */
export function formatPeriodRangeLabel(
  periodFrom: string | undefined,
  periodTo: string | undefined,
): string {
  if (!periodFrom && !periodTo) return 'All periods';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (periodFrom && periodTo) {
    const [yFrom, mFrom] = periodFrom.split('-').map(Number);
    const [yTo, mTo] = periodTo.split('-').map(Number);
    return `${months[mFrom - 1]} ${yFrom} - ${months[mTo - 1]} ${yTo}`;
  }
  if (periodFrom) {
    const [y, m] = periodFrom.split('-').map(Number);
    return `${months[m - 1]} ${y}`;
  }
  if (periodTo) {
    const [y, m] = periodTo.split('-').map(Number);
    return `${months[m - 1]} ${y}`;
  }
  return 'All periods';
}

export function PeriodRangeFilter({
  periodFrom,
  periodTo,
  onPeriodFromChange,
  onPeriodToChange,
  onApply,
  onReset,
  monthOptions,
  yearOptions,
}: PeriodRangeFilterProps) {
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleApply = useCallback(() => {
    const error = getPeriodRangeValidationError(periodFrom, periodTo);
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    onApply();
  }, [periodFrom, periodTo, onApply]);

  const handleReset = useCallback(() => {
    setValidationError(null);
    onReset();
  }, [onReset]);

  const from = parsePeriod(periodFrom);
  const to = parsePeriod(periodTo);

  const inlineLabelClass = 'text-xs text-muted-foreground shrink-0 w-8';

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border/80 bg-card px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          {/* From */}
          <div className="flex items-center gap-2">
            <span className={inlineLabelClass} aria-hidden="true">From</span>
            <Select
              value={from ? String(from.month) : 'all'}
              onValueChange={(v) => {
                if (v === 'all') {
                  onPeriodFromChange(undefined);
                  return;
                }
                const month = Number(v);
                const year = from?.year ?? yearOptions[0]?.value;
                onPeriodFromChange(toPeriod(month, year));
              }}
            >
              <SelectTrigger id="period-from-month" aria-label="From month" className="h-9 min-w-[7rem]">
                {from ? (
                  <SelectValue />
                ) : (
                  <span className="text-muted-foreground">Month</span>
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {monthOptions.map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={from ? String(from.year) : 'all'}
              onValueChange={(v) => {
                if (v === 'all') {
                  onPeriodFromChange(undefined);
                  return;
                }
                const year = Number(v);
                const month = from?.month ?? 1;
                onPeriodFromChange(toPeriod(month, year));
              }}
            >
              <SelectTrigger id="period-from-year" aria-label="From year" className="h-9 min-w-[5rem]">
                {from ? (
                  <SelectValue />
                ) : (
                  <span className="text-muted-foreground">Year</span>
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {yearOptions.map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* To */}
          <div className="flex items-center gap-2">
            <span className={inlineLabelClass} aria-hidden="true">To</span>
            <Select
              value={to ? String(to.month) : 'all'}
              onValueChange={(v) => {
                if (v === 'all') {
                  onPeriodToChange(undefined);
                  return;
                }
                const month = Number(v);
                const year = to?.year ?? yearOptions[0]?.value;
                onPeriodToChange(toPeriod(month, year));
              }}
            >
              <SelectTrigger id="period-to-month" aria-label="To month" className="h-9 min-w-[7rem]">
                {to ? (
                  <SelectValue />
                ) : (
                  <span className="text-muted-foreground">Month</span>
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {monthOptions.map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={to ? String(to.year) : 'all'}
              onValueChange={(v) => {
                if (v === 'all') {
                  onPeriodToChange(undefined);
                  return;
                }
                const year = Number(v);
                const month = to?.month ?? 12;
                onPeriodToChange(toPeriod(month, year));
              }}
            >
              <SelectTrigger id="period-to-year" aria-label="To year" className="h-9 min-w-[5rem]">
                {to ? (
                  <SelectValue />
                ) : (
                  <span className="text-muted-foreground">Year</span>
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {yearOptions.map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-1">
            <Button onClick={handleApply} size="sm" className="h-9">
              Apply
            </Button>
            <Button onClick={handleReset} variant="outline" size="sm" className="h-9">
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset
            </Button>
          </div>
        </div>
      </div>
      {validationError ? (
        <Alert variant="destructive">
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
