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

function getYearsInRange(params: IncidentProfileFilterParams): YearKey[] {
  if (!params.periodStart && !params.periodEnd) return YEAR_KEYS;
  let startIdx = 0;
  let endIdx = FISCAL_YEARS.length - 1;
  if (params.periodStart) {
    const idx = FISCAL_YEARS.indexOf(params.periodStart);
    if (idx >= 0) startIdx = idx;
  }
  if (params.periodEnd) {
    const idx = FISCAL_YEARS.indexOf(params.periodEnd);
    if (idx >= 0) endIdx = idx;
  }
  return YEAR_KEYS.filter((_, i) => i >= startIdx && i <= endIdx);
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

  getFiscalYearOptions: (): { value: string; label: string }[] =>
    FISCAL_YEARS.map((y) => ({ value: y, label: `Year ${y}` })),

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
