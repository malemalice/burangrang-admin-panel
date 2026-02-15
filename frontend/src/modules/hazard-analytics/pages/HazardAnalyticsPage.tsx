import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/core/components/ui/PageHeader';
import { PeriodRangeFilter, formatPeriodRangeLabel } from '@/core/components/ui/PeriodRangeFilter';
import {
  IncidentSummaryCard,
  IncidentPyramid,
  IncidentChart,
  HazardCaseStatusChart,
  HazardsByMonthTable,
  HazardTypeChart,
  NonConformanceCriteriaChart,
  TopUnsafeConditionsTable,
  HazardSummaryTable,
} from '../components';
import hazardAnalyticsService from '../services/hazardAnalyticsService';
import type { HazardFilterParams } from '../types/hazard-analytics.types';

const defaultFilters: HazardFilterParams = {};

export default function HazardAnalyticsPage() {
  const [filters, setFilters] = useState<HazardFilterParams>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<HazardFilterParams>(defaultFilters);

  const monthOptions = hazardAnalyticsService.getMonthOptions();
  const yearOptions = hazardAnalyticsService.getYearOptions();

  const { data, isLoading } = useQuery({
    queryKey: ['hazard-analytics', appliedFilters],
    queryFn: () => hazardAnalyticsService.getAnalyticsData(appliedFilters),
  });

  const handleApply = useCallback(() => {
    setAppliedFilters({ ...filters });
  }, [filters]);

  const handleReset = useCallback(() => {
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  }, []);

  const periodLabel = formatPeriodRangeLabel(appliedFilters.periodFrom, appliedFilters.periodTo);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Hazard and Non-Conformance Analytics"
        subtitle="Comprehensive hazard tracking and analysis dashboard"
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

      <div className="max-w-7xl space-y-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            Loading...
          </div>
        ) : data ? (
          <>
            {/* Row 1: Summary Card and Pyramid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <div className="min-h-[360px]">
                <IncidentSummaryCard data={data.incidentSummary} />
              </div>
              <div className="min-h-[360px]">
                <IncidentPyramid />
              </div>
            </div>

            {/* Row 2: Incident Chart and Status Pie Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="min-h-[360px]">
                <IncidentChart data={data.incidentSummary} />
              </div>
              <div className="min-h-[360px]">
                <HazardCaseStatusChart data={data.hazardStatus} periodLabel={periodLabel} />
              </div>
            </div>

            <HazardsByMonthTable data={data.monthlyHazards} />

            {/* Row 3a: Two charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <HazardTypeChart data={data.hazardTypes} />
              <NonConformanceCriteriaChart data={data.nonConformanceCriteria} />
            </div>

            {/* Row 3b: Top 10 full width */}
            <TopUnsafeConditionsTable data={data.topUnsafeConditions} />

            <HazardSummaryTable
              hazardTypes={data.hazardTypes}
              nonConformanceCriteria={data.nonConformanceCriteria}
              responsibleActions={data.responsibleActions}
              hazardStatus={data.hazardStatus}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
