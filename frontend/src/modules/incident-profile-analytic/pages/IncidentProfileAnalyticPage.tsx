import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/core/components/ui/PageHeader';
import {
  IncidentCountChart,
  IncidentPercentageChart,
  IncidentProfileFilters,
} from '../components';
import incidentProfileService from '../services/incidentProfileService';
import type { IncidentProfileFilterParams } from '../types/incident-profile.types';

const defaultFilters: IncidentProfileFilterParams = {};

export default function IncidentProfileAnalyticPage() {
  const [filters, setFilters] = useState<IncidentProfileFilterParams>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<IncidentProfileFilterParams>(defaultFilters);

  const monthOptions = incidentProfileService.getMonthOptions();
  const yearOptions = incidentProfileService.getYearOptions();

  const { data, isLoading } = useQuery({
    queryKey: ['incident-profile-analytic', appliedFilters],
    queryFn: () => incidentProfileService.getIncidentProfileData(appliedFilters),
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
        title="Incident Profile Analytic"
        subtitle="Minor incident analysis by category and fiscal year"
      />

      <IncidentProfileFilters
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <IncidentCountChart data={data.countData} />
          <IncidentPercentageChart data={data.percentageData} />
        </div>
      ) : null}
    </div>
  );
}
