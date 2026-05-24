import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/core/components/ui/PageHeader';
import { Card, CardContent } from '@/core/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Label } from '@/core/components/ui/label';
import waterQualityDashboardService from '../services/waterQualityDashboardService';
import { WaterQualityChart } from '../components/WaterQualityChart';
import type {
  WaterQualityDashboardData,
  WaterQualityLabReportCategory,
} from '../types/water-quality-dashboard.types';

const CATEGORY_OPTIONS: { value: WaterQualityLabReportCategory; label: string }[] = [
  { value: 'WASTEWATER', label: 'Wastewater' },
  { value: 'CLEAN_WATER', label: 'Clean Water' },
  { value: 'SWIMMING_POOL_WATER', label: 'Swimming Pool Water' },
  { value: 'DRINKING_WATER', label: 'Drinking Water' },
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => currentYear - i);

export default function WaterQualityDashboardPage() {
  const [category, setCategory] = useState<WaterQualityLabReportCategory>('WASTEWATER');
  const [year, setYear] = useState<number>(currentYear);
  const [parameterId, setParameterId] = useState<string | undefined>(undefined);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['water-quality-dashboard', category, year, parameterId],
    queryFn: () =>
      waterQualityDashboardService.getDashboard({ category, year, parameterId }),
    placeholderData: (prev) => prev,
  });

  const dashboard = data as WaterQualityDashboardData | undefined;

  const summaryCaption = useMemo(() => {
    if (!dashboard || !dashboard.parameter) return '';
    const avg = dashboard.yearSummary.average;
    if (avg === null) {
      return `No DONE lab reports found for ${dashboard.parameter.name} in ${year}.`;
    }
    return `During ${year}, average ${dashboard.parameter.name} across all treatment plants is ${avg.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${dashboard.parameter.unit}.`;
  }, [dashboard, year]);

  const handleCategoryChange = (value: string) => {
    setCategory(value as WaterQualityLabReportCategory);
    setParameterId(undefined);
  };

  const handleYearChange = (value: string) => {
    setYear(Number(value));
    setParameterId(undefined);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Water Monitoring Dashboard"
        subtitle="Monthly results per treatment plant for one parameter at a time"
      />

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="wq-category">Category</Label>
              <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger id="wq-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wq-year">Year</Label>
              <Select value={String(year)} onValueChange={handleYearChange}>
                <SelectTrigger id="wq-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wq-parameter">Parameter</Label>
              <Select
                value={dashboard?.parameter?.id ?? ''}
                onValueChange={(value) => setParameterId(value || undefined)}
                disabled={!dashboard || dashboard.availableParameters.length === 0}
              >
                <SelectTrigger id="wq-parameter">
                  <SelectValue
                    placeholder={
                      dashboard && dashboard.availableParameters.length === 0
                        ? 'No parameters available'
                        : 'Select parameter'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {dashboard?.availableParameters.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {summaryCaption && (
        <p className="text-sm text-muted-foreground text-center">{summaryCaption}</p>
      )}

      {isLoading && !dashboard ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Loading dashboard...
            </div>
          </CardContent>
        </Card>
      ) : dashboard ? (
        <div className={isFetching ? 'opacity-70 transition-opacity' : ''}>
          <WaterQualityChart data={dashboard} />
        </div>
      ) : null}
    </div>
  );
}
