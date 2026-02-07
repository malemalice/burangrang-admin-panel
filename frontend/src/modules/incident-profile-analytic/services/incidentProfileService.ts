import type {
  IncidentCategoryData,
  IncidentProfileFilterParams,
} from '../types/incident-profile.types';

const MOCK_INCIDENT_DATA: IncidentCategoryData[] = [
  { category: 'Got cut due to sharp edge material', year2022_2023: 2, year2023_2024: 4, year2024_2025: 3 },
  { category: 'Struck by or caught between objects', year2022_2023: 8, year2023_2024: 2, year2024_2025: 1 },
  { category: 'Eye injury caused by flying particles while grinding', year2022_2023: 0, year2023_2024: 0, year2024_2025: 1 },
  { category: 'Eye injury caused by chemical exposure', year2022_2023: 0, year2023_2024: 0, year2024_2025: 1 },
  { category: 'Got hit by falling object', year2022_2023: 1, year2023_2024: 2, year2024_2025: 2 },
  { category: 'Fall (tripped or slipped)', year2022_2023: 6, year2023_2024: 5, year2024_2025: 17 },
  { category: 'Skin Injury caused by Chemical exposure', year2022_2023: 0, year2023_2024: 0, year2024_2025: 1 },
  { category: 'Stung by a bee', year2022_2023: 0, year2023_2024: 1, year2024_2025: 4 },
  { category: 'Skin Injury caused by contact with hot surface', year2022_2023: 0, year2023_2024: 10, year2024_2025: 4 },
  { category: 'Injury caused by a door pinch', year2022_2023: 0, year2023_2024: 1, year2024_2025: 2 },
  { category: 'Vehicle accident', year2022_2023: 1, year2023_2024: 0, year2024_2025: 0 },
];

const FISCAL_YEARS = ['2022-2023', '2023-2024', '2024-2025'];

type YearKey = 'year2022_2023' | 'year2023_2024' | 'year2024_2025';

const YEAR_KEYS: YearKey[] = ['year2022_2023', 'year2023_2024', 'year2024_2025'];

/** Fiscal year "YYYY-ZZZZ" covers Aug YYYY to Jul ZZZZ. */
function fiscalYearOverlapsRange(fy: string, periodFrom: string, periodTo: string): boolean {
  const [startY] = fy.split('-').map(Number);
  const endY = startY + 1;
  const rangeStart = `${startY}-08`;
  const rangeEnd = `${endY}-07`;
  return periodFrom <= rangeEnd && periodTo >= rangeStart;
}

function getYearsInRange(params: IncidentProfileFilterParams): YearKey[] {
  if (!params.periodFrom && !params.periodTo) return YEAR_KEYS;
  const from = params.periodFrom ?? '0000-00';
  const to = params.periodTo ?? '9999-99';
  return YEAR_KEYS.filter((_, i) => fiscalYearOverlapsRange(FISCAL_YEARS[i], from, to));
}

function toPercentageData(countData: IncidentCategoryData[]): IncidentCategoryData[] {
  return countData.map((row) => {
    const total =
      row.year2022_2023 + row.year2023_2024 + row.year2024_2025;
    if (total === 0) {
      return {
        ...row,
        year2022_2023: 0,
        year2023_2024: 0,
        year2024_2025: 0,
      };
    }
    return {
      category: row.category,
      year2022_2023: Math.round((row.year2022_2023 / total) * 1000) / 10,
      year2023_2024: Math.round((row.year2023_2024 / total) * 1000) / 10,
      year2024_2025: Math.round((row.year2024_2025 / total) * 1000) / 10,
    };
  });
}

export interface IncidentProfileData {
  countData: IncidentCategoryData[];
  percentageData: IncidentCategoryData[];
  yearsToShow: YearKey[];
}

const incidentProfileService = {
  getIncidentProfileData: async (
    params?: IncidentProfileFilterParams
  ): Promise<IncidentProfileData> => {
    const p = params ?? {};
    const yearsToShow = getYearsInRange(p);
    const countData = [...MOCK_INCIDENT_DATA];
    const percentageData = toPercentageData(countData);
    return { countData, percentageData, yearsToShow };
  },

  getMonthYearOptions: (): { value: string; label: string }[] => {
    const MONTH_ABBREV = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const options: { value: string; label: string }[] = [];
    for (let y = 2022; y <= 2025; y++) {
      for (let m = 1; m <= 12; m++) {
        const value = `${y}-${String(m).padStart(2, '0')}`;
        const label = `${MONTH_ABBREV[m - 1]} ${y}`;
        options.push({ value, label });
      }
    }
    return options;
  },

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

export default incidentProfileService;
