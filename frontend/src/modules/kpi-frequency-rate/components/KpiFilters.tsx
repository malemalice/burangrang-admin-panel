import { Button } from '@/core/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Label } from '@/core/components/ui/label';
import { RotateCcw } from 'lucide-react';

interface KpiFiltersProps {
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

export function KpiFilters({
  periodFrom,
  periodTo,
  onPeriodFromChange,
  onPeriodToChange,
  onApply,
  onReset,
  monthOptions,
  yearOptions,
}: KpiFiltersProps) {
  const from = parsePeriod(periodFrom);
  const to = parsePeriod(periodTo);

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4">
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">From</Label>
        <div className="flex gap-2">
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
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Month" />
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
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Year" />
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
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">To</Label>
        <div className="flex gap-2">
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
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Month" />
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
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Year" />
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
      </div>
      <div className="flex gap-2">
        <Button onClick={onApply} size="sm">
          Apply
        </Button>
        <Button onClick={onReset} variant="outline" size="sm">
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset
        </Button>
      </div>
    </div>
  );
}
