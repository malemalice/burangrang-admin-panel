import api from '@/core/lib/api';
import type { KpiDataPoint, KpiFrequencyRateData, KpiFilterParams } from '../types/kpi-frequency-rate.types';

/** LTICR not in scope - uses placeholder data until backend implements it */
const MOCK_LTICR: KpiDataPoint[] = [
  { year: '2019-2020', studyRelated: 0, workRelated: 0, total: 0 },
  { year: '2020-2021', studyRelated: 0, workRelated: 0, total: 0 },
  { year: '2021-2022', studyRelated: 0, workRelated: 0, total: 0 },
  { year: '2022-2023', studyRelated: 0.13, workRelated: 0, total: 0.13 },
  { year: '2023-2024', studyRelated: 0.1, workRelated: 0, total: 0.1 },
  { year: '2024-2025', studyRelated: 0.08, workRelated: 0.82, total: 0.33 },
];

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
    const [trifrRes, trsrRes] = await Promise.all([
      api.get<{ data: KpiDataPoint[] }>(`/kpi/trifr${query}`),
      api.get<{ data: KpiDataPoint[] }>(`/kpi/trsr${query}`),
    ]);
    return {
      trifr: trifrRes.data.data,
      trsr: trsrRes.data.data,
      lticr: MOCK_LTICR, // LTICR not in scope - placeholder until backend implements
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
