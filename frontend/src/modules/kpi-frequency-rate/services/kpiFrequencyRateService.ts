import type { KpiDataPoint, KpiFrequencyRateData, KpiFilterParams } from '../types/kpi-frequency-rate.types';

const MOCK_TRIFR: KpiDataPoint[] = [
  { year: '2019-2020', studyRelated: 6.46, workRelated: 2.96, total: 5.4 },
  { year: '2020-2021', studyRelated: 3.23, workRelated: 1.47, total: 1.8 },
  { year: '2021-2022', studyRelated: 2.33, workRelated: 3.06, total: 1.27 },
  { year: '2022-2023', studyRelated: 2.28, workRelated: 4.93, total: 1.27 },
  { year: '2023-2024', studyRelated: 3.93, workRelated: 5.27, total: 1.5 },
  { year: '2024-2025', studyRelated: 5.55, workRelated: 6.84, total: 1.66 },
];

const MOCK_TRSR: KpiDataPoint[] = [
  { year: '2019-2020', studyRelated: 0, workRelated: 0, total: 0 },
  { year: '2020-2021', studyRelated: 0, workRelated: 0, total: 0 },
  { year: '2021-2022', studyRelated: 0, workRelated: 0, total: 0 },
  { year: '2022-2023', studyRelated: 0.25, workRelated: 0, total: 0.08 },
  { year: '2023-2024', studyRelated: 0.2, workRelated: 0, total: 0.05 },
  { year: '2024-2025', studyRelated: 0.25, workRelated: 0.82, total: 0.11 },
];

const MOCK_LTICR: KpiDataPoint[] = [
  { year: '2019-2020', studyRelated: 0, workRelated: 0, total: 0 },
  { year: '2020-2021', studyRelated: 0, workRelated: 0, total: 0 },
  { year: '2021-2022', studyRelated: 0, workRelated: 0, total: 0 },
  { year: '2022-2023', studyRelated: 0.13, workRelated: 0, total: 0.13 },
  { year: '2023-2024', studyRelated: 0.1, workRelated: 0, total: 0.1 },
  { year: '2024-2025', studyRelated: 0.08, workRelated: 0.82, total: 0.33 },
];

const FISCAL_YEARS = ['2019-2020', '2020-2021', '2021-2022', '2022-2023', '2023-2024', '2024-2025'];

function filterByPeriod<T extends KpiDataPoint>(data: T[], params: KpiFilterParams): T[] {
  if (!params.periodStart && !params.periodEnd) return data;
  return data.filter((row) => {
    const idx = FISCAL_YEARS.indexOf(row.year);
    if (idx < 0) return false;
    if (params.periodStart) {
      const startIdx = FISCAL_YEARS.indexOf(params.periodStart);
      if (startIdx >= 0 && idx < startIdx) return false;
    }
    if (params.periodEnd) {
      const endIdx = FISCAL_YEARS.indexOf(params.periodEnd);
      if (endIdx >= 0 && idx > endIdx) return false;
    }
    return true;
  });
}

const kpiFrequencyRateService = {
  getKpiData: async (params?: KpiFilterParams): Promise<KpiFrequencyRateData> => {
    const p = params ?? {};
    return {
      trifr: filterByPeriod(MOCK_TRIFR, p),
      trsr: filterByPeriod(MOCK_TRSR, p),
      lticr: filterByPeriod(MOCK_LTICR, p),
    };
  },

  getFiscalYearOptions: (): { value: string; label: string }[] =>
    FISCAL_YEARS.map((y) => ({ value: y, label: y })),

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
