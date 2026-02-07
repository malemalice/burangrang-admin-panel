import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/core/components/ui/PageHeader';
import {
  SecurityFilters,
  IncidentSummaryCard,
  IncidentTriangleChart,
  IncidentCaseStatusChart,
  TypeNonConformanceChart,
  PartiesInvolvedChart,
  SifrComparisonTable,
  YearComparisonChart,
  IncidentsByMonthTable,
  SecuritySummaryTable,
} from '../components';
import securityTeamService from '../services/securityTeamService';
import type { SecurityFilterParams } from '../types/security-team.types';

const defaultFilters: SecurityFilterParams = {};

export default function SecurityTeamPage() {
  const [filters, setFilters] = useState<SecurityFilterParams>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<SecurityFilterParams>(defaultFilters);

  const periodOptions = securityTeamService.getFiscalYearOptions();
  const monthOptions = securityTeamService.getMonthOptions();
  const yearOptions = securityTeamService.getYearOptions();

  const { data, isLoading } = useQuery({
    queryKey: ['security-team', appliedFilters],
    queryFn: () => securityTeamService.getAnalyticsData(appliedFilters),
  });

  const handleApply = useCallback(() => {
    setAppliedFilters({ ...filters });
  }, [filters]);

  const handleReset = useCallback(() => {
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  }, []);

  const periodLabel = appliedFilters.periodStart && appliedFilters.periodEnd
    ? `${appliedFilters.periodStart} - ${appliedFilters.periodEnd}`
    : appliedFilters.periodStart
      ? appliedFilters.periodStart
      : '2024-2025';

  return (
    <div className="space-y-8">
      <PageHeader
        title="Security Team"
        subtitle="Security incident analytics and reporting dashboard"
      />

      <SecurityFilters
        periodStart={filters.periodStart}
        periodEnd={filters.periodEnd}
        month={filters.month}
        year={filters.year}
        onPeriodStartChange={(v) => setFilters((prev) => ({ ...prev, periodStart: v }))}
        onPeriodEndChange={(v) => setFilters((prev) => ({ ...prev, periodEnd: v }))}
        onMonthChange={(v) => setFilters((prev) => ({ ...prev, month: v }))}
        onYearChange={(v) => setFilters((prev) => ({ ...prev, year: v }))}
        onApply={handleApply}
        onReset={handleReset}
        periodOptions={periodOptions}
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
            <TypeNonConformanceChart data={data.typeNonConformance} periodLabel={periodLabel} />
            <PartiesInvolvedChart data={data.partiesInvolved} periodLabel={periodLabel} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <IncidentSummaryCard data={data.incidentSummary} />
            <IncidentTriangleChart data={data.incidentSummary} />
            <IncidentCaseStatusChart data={data.caseStatus} periodLabel={periodLabel} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SifrComparisonTable data={data.sifrComparison} />
            <YearComparisonChart data={data.sifrComparison} />
          </div>

          <IncidentsByMonthTable data={data.monthlyIncidents} />

          <SecuritySummaryTable
            typeNonConformance={data.typeNonConformance}
            partiesInvolved={data.partiesInvolved}
            caseStatus={data.caseStatus}
          />
        </>
      ) : null}
    </div>
  );
}
