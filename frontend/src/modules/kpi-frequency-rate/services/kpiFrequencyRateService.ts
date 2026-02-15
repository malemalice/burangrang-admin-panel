import api from '@/core/lib/api';
import { getYearOptions, getMonthYearOptions, YEAR_RANGE_START, getCurrentYear } from '@/core/utils/date';
import type { KpiDataPoint, KpiFrequencyRateData, KpiFilterParams } from '../types/kpi-frequency-rate.types';

function buildQueryParams(params?: KpiFilterParams): string {
  const p = params ?? {};
  const search = new URLSearchParams();
  if (p.periodFrom) search.set('periodFrom', p.periodFrom);
  if (p.periodTo) search.set('periodTo', p.periodTo);
  const q = search.toString();
  return q ? `?${q}` : '';
}

const kpiFrequencyRateService = {
  getKpiData: async (params?: KpiFilterParams): Promise<KpiFrequencyRateData> => {
    const query = buildQueryParams(params);
    const [trifrRes, trsrRes, lticrRes] = await Promise.all([
      api.get<{ data: KpiDataPoint[] }>(`/kpi/trifr${query}`),
      api.get<{ data: KpiDataPoint[] }>(`/kpi/trsr${query}`),
      api.get<{ data: KpiDataPoint[] }>(`/kpi/lticr${query}`),
    ]);
    return {
      trifr: trifrRes.data.data,
      trsr: trsrRes.data.data,
      lticr: lticrRes.data.data,
    };
  },

  getMonthYearOptions: (): { value: string; label: string }[] =>
    getMonthYearOptions(YEAR_RANGE_START, getCurrentYear()),

  getMonthOptions: (): { value: number; label: string }[] => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return months.map((label, i) => ({ value: i + 1, label }));
  },

  getYearOptions,
};

export default kpiFrequencyRateService;
