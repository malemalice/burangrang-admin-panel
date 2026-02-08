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
  FISCAL_YEAR_OPTIONS,
  type IncidentProfileFilterParams,
} from '../types/incident-profile.types';

const DEFAULT_FISCAL_YEARS = FISCAL_YEAR_OPTIONS.map((o) => o.value);
const defaultFilters: IncidentProfileFilterParams = {
  fiscalYears: DEFAULT_FISCAL_YEARS,
};
const DEFAULT_YEARS_TO_SHOW = ['year2022_2023', 'year2023_2024', 'year2024_2025'];

export default function IncidentProfileAnalyticPage() {
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
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  }, []);

  const yearsToShow = data?.yearsToShow?.length
    ? data.yearsToShow
    : DEFAULT_YEARS_TO_SHOW;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Incident Profile Analytic"
        subtitle="Minor incident analysis by category and fiscal year"
      />

      <IncidentProfileFilters
        selectedFiscalYears={filters.fiscalYears ?? DEFAULT_FISCAL_YEARS}
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
