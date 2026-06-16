import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/core/components/ui/PageHeader';
import { PeriodRangeFilter } from '@/core/components/ui/PeriodRangeFilter';
import {
  TRIFRChart,
  TRSRChart,
  LTICRChart,
  KpiDataTable,
} from '../components';
import kpiFrequencyRateService from '../services/kpiFrequencyRateService';
import type { KpiFilterParams } from '../types/kpi-frequency-rate.types';

const defaultFilters: KpiFilterParams = {};

export default function KpiFrequencyRatePage() {
  const [filters, setFilters] = useState<KpiFilterParams>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<KpiFilterParams>(defaultFilters);

  const monthOptions = kpiFrequencyRateService.getMonthOptions();
  const yearOptions = kpiFrequencyRateService.getYearOptions();

  const { data, isLoading } = useQuery({
    queryKey: ['kpi-frequency-rate', appliedFilters],
    queryFn: () => kpiFrequencyRateService.getKpiData(appliedFilters),
  });

  const handleApply = useCallback(() => {
    setAppliedFilters({ ...filters });
  }, [filters]);

  const handleReset = useCallback(() => {
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Incident Frequency Rate Charts"
        subtitle="HSE KPI metrics: TRIFR, TRSR, and Lost Time Incident Case Rate"
      />

      <PeriodRangeFilter
        periodFrom={filters.periodFrom}
        periodTo={filters.periodTo}
        onPeriodFromChange={(v) => setFilters((prev) => ({ ...prev, periodFrom: v }))}
        onPeriodToChange={(v) => setFilters((prev) => ({ ...prev, periodTo: v }))}
        onApply={handleApply}
        onReset={handleReset}
        monthOptions={monthOptions}
        yearOptions={yearOptions}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Loading...
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TRIFRChart data={data.trifr} />
            <TRSRChart data={data.trsr} />
          </div>

          <LTICRChart data={data.lticr} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <KpiDataTable
              title="TRIFR Data Table"
              data={data.trifr}
              studyLabel="IFR study related activities"
              workLabel="IFR work related activities"
              totalLabel="Total IFR"
            />
            <KpiDataTable
              title="TRSR Data Table"
              data={data.trsr}
              studyLabel="SR study related activities"
              workLabel="SR work related activities"
              totalLabel="Total SR"
            />
          </div>

          <KpiDataTable
            title="LTICR Data Table"
            data={data.lticr}
            studyLabel="LTI CR Study Related Activities"
            workLabel="LTI CR Work Related Activities"
            totalLabel="Total LTI Case Rate"
          />
        </>
      ) : null}
    </div>
  );
}
