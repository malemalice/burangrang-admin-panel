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

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Loading...
        </div>
      ) : data ? (
        <>
          {/* Row 1: Summary Card and Pyramid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <IncidentSummaryCard data={data.incidentSummary} />
            <IncidentPyramid />
          </div>

          {/* Row 2: Incident Chart and Status Pie Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <IncidentChart data={data.incidentSummary} />
            <HazardCaseStatusChart data={data.hazardStatus} periodLabel={periodLabel} />
          </div>

          <HazardsByMonthTable data={data.monthlyHazards} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <HazardTypeChart data={data.hazardTypes} />
            <NonConformanceCriteriaChart data={data.nonConformanceCriteria} />
            <TopUnsafeConditionsTable data={data.topUnsafeConditions} />
          </div>

          <HazardSummaryTable
            hazardTypes={data.hazardTypes}
            nonConformanceCriteria={data.nonConformanceCriteria}
            responsibleActions={data.responsibleActions}
            hazardStatus={data.hazardStatus}
          />
        </>
      ) : null}
    </div>
  );
}
