import api from '@/core/lib/api';
import type { KpiDataPoint, KpiFrequencyRateData, KpiFilterParams } from '../types/kpi-frequency-rate.types';

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
    buildMonthYearOptions(2019, 2025),

  getMonthOptions: (): { value: number; label: string }[] => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return months.map((label, i) => ({ value: i + 1, label }));
  },

  getYearOptions: (): { value: number; label: string }[] =>
    [2019, 2020, 2021, 2022, 2023, 2024, 2025].map((y) => ({ value: y, label: String(y) })),
};

export default kpiFrequencyRateService;
