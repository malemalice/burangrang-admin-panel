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

  const periodLabel = appliedFilters.periodFrom && appliedFilters.periodTo
    ? (() => {
        const from = appliedFilters.periodFrom;
        const to = appliedFilters.periodTo;
        const [yFrom, mFrom] = from.split('-').map(Number);
        const [yTo, mTo] = to.split('-').map(Number);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[mFrom - 1]} ${yFrom} - ${months[mTo - 1]} ${yTo}`;
      })()
    : appliedFilters.periodFrom
      ? (() => {
          const [y, m] = appliedFilters.periodFrom.split('-').map(Number);
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return `${months[m - 1]} ${y}`;
        })()
      : 'Aug 2024 - Jul 2025';

  return (
    <div className="space-y-8">
      <PageHeader
        title="Security Team"
        subtitle="Security incident analytics and reporting dashboard"
      />

      <SecurityFilters
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
