import api from '@/core/lib/api';
import type {
  SecurityTeamAnalyticsData,
  SecurityFilterParams,
  IncidentSummaryItem,
  MonthlyIncidentData,
  TypeNonConformanceItem,
  PartiesInvolvedItem,
  CaseStatus,
  SifrComparisonRow,
} from '../types/security-team.types';

const MONTH_ABBREV = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildMonthYearOptions(startYear: number, endYear: number): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let y = startYear; y <= endYear; y++) {
    for (let m = 1; m <= 12; m++) {
      const value = `${y}-${String(m).padStart(2, '0')}`;
      const label = `${MONTH_ABBREV[m - 1]} ${y}`;
      options.push({ value, label });
    }
  }
  return options;
}

const securityTeamService = {
  getIncidentSummary: async (
    params?: SecurityFilterParams,
  ): Promise<IncidentSummaryItem[]> => {
    const queryParams = new URLSearchParams();
    if (params?.periodFrom) queryParams.append('periodFrom', params.periodFrom);
    if (params?.periodTo) queryParams.append('periodTo', params.periodTo);
    const response = await api.get<IncidentSummaryItem[]>(
      `/dashboard/security-incident-summary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
    );
    return response.data;
  },

  getCaseStatus: async (params?: SecurityFilterParams): Promise<CaseStatus> => {
    const queryParams = new URLSearchParams();
    if (params?.periodFrom) queryParams.append('periodFrom', params.periodFrom);
    if (params?.periodTo) queryParams.append('periodTo', params.periodTo);
    const response = await api.get<CaseStatus>(
      `/dashboard/security-case-status${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
    );
    return response.data;
  },

  getTypeNonConformance: async (
    params?: SecurityFilterParams,
  ): Promise<TypeNonConformanceItem[]> => {
    const queryParams = new URLSearchParams();
    if (params?.periodFrom) queryParams.append('periodFrom', params.periodFrom);
    if (params?.periodTo) queryParams.append('periodTo', params.periodTo);
    const response = await api.get<TypeNonConformanceItem[]>(
      `/dashboard/security-type-non-conformance${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
    );
    return response.data;
  },

  getPartiesInvolved: async (
    params?: SecurityFilterParams,
  ): Promise<PartiesInvolvedItem[]> => {
    const queryParams = new URLSearchParams();
    if (params?.periodFrom) queryParams.append('periodFrom', params.periodFrom);
    if (params?.periodTo) queryParams.append('periodTo', params.periodTo);
    const response = await api.get<PartiesInvolvedItem[]>(
      `/dashboard/security-parties-involved${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
    );
    return response.data;
  },

  getSifrComparison: async (): Promise<SifrComparisonRow[]> => {
    const response = await api.get<SifrComparisonRow[]>(
      '/dashboard/security-sifr-comparison',
    );
    return response.data;
  },

  getMonthlyIncidents: async (
    params?: SecurityFilterParams,
  ): Promise<MonthlyIncidentData[]> => {
    const queryParams = new URLSearchParams();
    if (params?.periodFrom) queryParams.append('periodFrom', params.periodFrom);
    if (params?.periodTo) queryParams.append('periodTo', params.periodTo);
    const response = await api.get<MonthlyIncidentData[]>(
      `/dashboard/security-monthly-incidents${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
    );
    return response.data;
  },

  getAnalyticsData: async (params?: SecurityFilterParams): Promise<SecurityTeamAnalyticsData> => {
    const p = params ?? {};
    const [
      incidentSummary,
      monthlyIncidents,
      typeNonConformance,
      partiesInvolved,
      caseStatus,
      sifrComparison,
    ] = await Promise.all([
      securityTeamService.getIncidentSummary(p),
      securityTeamService.getMonthlyIncidents(p),
      securityTeamService.getTypeNonConformance(p),
      securityTeamService.getPartiesInvolved(p),
      securityTeamService.getCaseStatus(p),
      securityTeamService.getSifrComparison(),
    ]);
    return {
      incidentSummary,
      monthlyIncidents,
      typeNonConformance,
      partiesInvolved,
      caseStatus,
      sifrComparison,
    };
  },

  getMonthYearOptions: (): { value: string; label: string }[] =>
    buildMonthYearOptions(2022, 2025),

  getMonthOptions: (): { value: number; label: string }[] => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return months.map((label, i) => ({ value: i + 1, label }));
  },

  getYearOptions: (): { value: number; label: string }[] =>
    [2022, 2023, 2024, 2025].map((y) => ({ value: y, label: String(y) })),
};

export default securityTeamService;
