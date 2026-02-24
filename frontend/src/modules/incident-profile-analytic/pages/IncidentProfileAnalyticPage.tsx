import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/core/components/ui/PageHeader';
import {
  IncidentCountChart,
  IncidentPercentageChart,
  IncidentProfileFilters,
} from '../components';
import incidentProfileService from '../services/incidentProfileService';
import {
  getFiscalYearOptions,
  type IncidentProfileFilterParams,
} from '../types/incident-profile.types';

function getDefaultFiscalYears(): string[] {
  return getFiscalYearOptions().slice(-3).map((o) => o.value);
}

export default function IncidentProfileAnalyticPage() {
  const defaultFiscalYears = getDefaultFiscalYears();
  const defaultFilters: IncidentProfileFilterParams = { fiscalYears: defaultFiscalYears };

  const [filters, setFilters] = useState<IncidentProfileFilterParams>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<IncidentProfileFilterParams>(defaultFilters);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['incident-profile-analytic', appliedFilters],
    queryFn: () => incidentProfileService.getIncidentProfileData(appliedFilters),
  });

  const handleApply = useCallback(() => {
    setAppliedFilters({ ...filters });
  }, [filters]);

  const handleReset = useCallback(() => {
    const nextDefaults = { fiscalYears: getDefaultFiscalYears() };
    setFilters(nextDefaults);
    setAppliedFilters(nextDefaults);
  }, []);

  const yearsToShow = data?.yearsToShow?.length ? data.yearsToShow : getDefaultFiscalYears();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Incident Profile Analytic"
        subtitle="Minor incident analysis by category and fiscal year"
      />

      <IncidentProfileFilters
        selectedFiscalYears={filters.fiscalYears ?? defaultFiscalYears}
        onSelectionChange={(fiscalYears) =>
          setFilters((prev) => ({ ...prev, fiscalYears }))
        }
        onApply={handleApply}
        onReset={handleReset}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Loading...
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center py-12 text-destructive">
          Failed to load incident profile data. Please try again.
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <IncidentCountChart data={data.countData} yearsToShow={yearsToShow} />
          <IncidentPercentageChart data={data.percentageData} yearsToShow={yearsToShow} />
        </div>
      ) : null}
    </div>
  );
}
