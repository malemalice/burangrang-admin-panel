import api from '@/core/lib/api';
import type {
  HazardAnalyticsData,
  HazardFilterParams,
  IncidentSummary,
  MonthlyHazardData,
  HazardTypeData,
  NonConformanceCriteria,
  ResponsibleAction,
  HazardStatus,
  TopUnsafeCondition,
} from '../types/hazard-analytics.types';

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

const hazardAnalyticsService = {
  getIncidentSummary: async (params?: HazardFilterParams): Promise<IncidentSummary[]> => {
    const queryParams = new URLSearchParams();
    if (params?.periodFrom) queryParams.append('periodFrom', params.periodFrom);
    if (params?.periodTo) queryParams.append('periodTo', params.periodTo);
    const response = await api.get<IncidentSummary[]>(
      `/dashboard/incident-summary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
    );
    return response.data;
  },

  getHazardCaseStatus: async (params?: HazardFilterParams): Promise<HazardStatus> => {
    const queryParams = new URLSearchParams();
    if (params?.periodFrom) queryParams.append('periodFrom', params.periodFrom);
    if (params?.periodTo) queryParams.append('periodTo', params.periodTo);
    const response = await api.get<HazardStatus>(
      `/dashboard/hazard-case-status${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
    );
    return response.data;
  },

  getMonthlyHazards: async (params?: HazardFilterParams): Promise<MonthlyHazardData[]> => {
    const queryParams = new URLSearchParams();
    if (params?.periodFrom) queryParams.append('periodFrom', params.periodFrom);
    if (params?.periodTo) queryParams.append('periodTo', params.periodTo);
    const response = await api.get<MonthlyHazardData[]>(
      `/dashboard/monthly-hazards${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
    );
    return response.data;
  },

  getHazardTypes: async (params?: HazardFilterParams): Promise<HazardTypeData[]> => {
    const queryParams = new URLSearchParams();
    if (params?.periodFrom) queryParams.append('periodFrom', params.periodFrom);
    if (params?.periodTo) queryParams.append('periodTo', params.periodTo);
    const response = await api.get<HazardTypeData[]>(
      `/dashboard/hazard-types${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
    );
    return response.data;
  },

  getNonConformanceCriteria: async (params?: HazardFilterParams): Promise<NonConformanceCriteria[]> => {
    const queryParams = new URLSearchParams();
    if (params?.periodFrom) queryParams.append('periodFrom', params.periodFrom);
    if (params?.periodTo) queryParams.append('periodTo', params.periodTo);
    const response = await api.get<NonConformanceCriteria[]>(
      `/dashboard/non-conformance-criteria${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
    );
    return response.data;
  },

  getTopUnsafeConditions: async (params?: HazardFilterParams): Promise<TopUnsafeCondition[]> => {
    const queryParams = new URLSearchParams();
    if (params?.periodFrom) queryParams.append('periodFrom', params.periodFrom);
    if (params?.periodTo) queryParams.append('periodTo', params.periodTo);
    const response = await api.get<{ condition: string; reportCount: number }[]>(
      `/dashboard/top-unsafe-conditions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
    );
    return response.data.map((item, index) => ({
      rank: index + 1,
      condition: item.condition,
      reportCount: item.reportCount,
    }));
  },

  getResponsibleActions: async (params?: HazardFilterParams): Promise<ResponsibleAction[]> => {
    const queryParams = new URLSearchParams();
    if (params?.periodFrom) queryParams.append('periodFrom', params.periodFrom);
    if (params?.periodTo) queryParams.append('periodTo', params.periodTo);
    const response = await api.get<ResponsibleAction[]>(
      `/dashboard/responsible-actions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
    );
    return response.data;
  },

  getAnalyticsData: async (params?: HazardFilterParams): Promise<HazardAnalyticsData> => {
    const p = params ?? {};
    const [
      incidentSummary,
      hazardStatus,
      monthlyHazards,
      hazardTypes,
      nonConformanceCriteria,
      topUnsafeConditions,
      responsibleActions,
    ] = await Promise.all([
      hazardAnalyticsService.getIncidentSummary(p),
      hazardAnalyticsService.getHazardCaseStatus(p),
      hazardAnalyticsService.getMonthlyHazards(p),
      hazardAnalyticsService.getHazardTypes(p),
      hazardAnalyticsService.getNonConformanceCriteria(p),
      hazardAnalyticsService.getTopUnsafeConditions(p),
      hazardAnalyticsService.getResponsibleActions(p),
    ]);
    return {
      incidentSummary,
      monthlyHazards,
      hazardTypes,
      nonConformanceCriteria,
      responsibleActions,
      hazardStatus,
      topUnsafeConditions,
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

export default hazardAnalyticsService;
