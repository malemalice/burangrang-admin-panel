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

interface IncidentProfileFiltersProps {
  periodStart: string | undefined;
  periodEnd: string | undefined;
  month: number | undefined;
  year: number | undefined;
  onPeriodStartChange: (value: string | undefined) => void;
  onPeriodEndChange: (value: string | undefined) => void;
  onMonthChange: (value: number | undefined) => void;
  onYearChange: (value: number | undefined) => void;
  onApply: () => void;
  onReset: () => void;
  periodOptions: { value: string; label: string }[];
  monthOptions: { value: number; label: string }[];
  yearOptions: { value: number; label: string }[];
}

export function IncidentProfileFilters({
  periodStart,
  periodEnd,
  month,
  year,
  onPeriodStartChange,
  onPeriodEndChange,
  onMonthChange,
  onYearChange,
  onApply,
  onReset,
  periodOptions,
  monthOptions,
  yearOptions,
}: IncidentProfileFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4">
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Period (Start)</Label>
        <Select
          value={periodStart ?? 'all'}
          onValueChange={(v) => onPeriodStartChange(v === 'all' ? undefined : v)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {periodOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Period (End)</Label>
        <Select
          value={periodEnd ?? 'all'}
          onValueChange={(v) => onPeriodEndChange(v === 'all' ? undefined : v)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {periodOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Month</Label>
        <Select
          value={month != null ? String(month) : 'all'}
          onValueChange={(v) => onMonthChange(v === 'all' ? undefined : Number(v))}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All" />
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
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Year</Label>
        <Select
          value={year != null ? String(year) : 'all'}
          onValueChange={(v) => onYearChange(v === 'all' ? undefined : Number(v))}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="All" />
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
