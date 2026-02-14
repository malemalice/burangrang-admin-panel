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

/** Fiscal year "YYYY-ZZZZ" covers Aug YYYY to Jul ZZZZ. Check if [periodFrom, periodTo] overlaps. */
function fiscalYearOverlapsRange(fy: string, periodFrom: string, periodTo: string): boolean {
  const [startY] = fy.split('-').map(Number);
  const endY = startY + 1;
  const rangeStart = `${startY}-08`;
  const rangeEnd = `${endY}-07`;
  return periodFrom <= rangeEnd && periodTo >= rangeStart;
}

function filterByPeriod<T extends KpiDataPoint>(data: T[], params: KpiFilterParams): T[] {
  if (!params.periodFrom && !params.periodTo) return data;
  const from = params.periodFrom ?? '0000-00';
  const to = params.periodTo ?? '9999-99';
  return data.filter((row) => {
    return FISCAL_YEARS.includes(row.year) && fiscalYearOverlapsRange(row.year, from, to);
  });
}

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

const kpiFrequencyRateService = {
  getKpiData: async (params?: KpiFilterParams): Promise<KpiFrequencyRateData> => {
    const p = params ?? {};
    return {
      trifr: filterByPeriod(MOCK_TRIFR, p),
      trsr: filterByPeriod(MOCK_TRSR, p),
      lticr: filterByPeriod(MOCK_LTICR, p),
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
