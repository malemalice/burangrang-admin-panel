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

const MOCK_INCIDENT_SUMMARY: IncidentSummary[] = [
  { category: 'Fatality', actual: 0, target: 0 },
  { category: 'Major Accident', actual: 2, target: -2 },
  { category: 'Minor Accident/Recordable Injuries', actual: 36, target: -36 },
  { category: 'Near Miss', actual: 6, target: -6 },
  { category: 'Hazard', actual: 255, target: -255 },
];

const MONTH_LABELS = [
  'Aug 2023', 'Sep 2023', 'Oct 2023', 'Nov 2023', 'Dec 2023', 'Jan 2024',
  'Feb 2024', 'Mar 2024', 'Apr 2024', 'May 2024', 'Jun 2024', 'Jul 2024',
];

const MOCK_MONTHLY_HAZARDS: MonthlyHazardData[] = [
  {
    category: 'Hazard',
    months: [
      { month: 'Aug 2023', count: 47 }, { month: 'Sep 2023', count: 10 },
      { month: 'Oct 2023', count: 39 }, { month: 'Nov 2023', count: 13 },
      { month: 'Dec 2023', count: 40 }, { month: 'Jan 2024', count: 13 },
      { month: 'Feb 2024', count: 12 }, { month: 'Mar 2024', count: 23 },
      { month: 'Apr 2024', count: 11 }, { month: 'May 2024', count: 16 },
      { month: 'Jun 2024', count: 11 }, { month: 'Jul 2024', count: 20 },
    ],
    total: 255,
  },
  {
    category: 'Nearmiss',
    months: [
      { month: 'Aug 2023', count: 0 }, { month: 'Sep 2023', count: 0 },
      { month: 'Oct 2023', count: 4 }, { month: 'Nov 2023', count: 0 },
      { month: 'Dec 2023', count: 0 }, { month: 'Jan 2024', count: 0 },
      { month: 'Feb 2024', count: 0 }, { month: 'Mar 2024', count: 0 },
      { month: 'Apr 2024', count: 1 }, { month: 'May 2024', count: 1 },
      { month: 'Jun 2024', count: 0 }, { month: 'Jul 2024', count: 0 },
    ],
    total: 6,
  },
  {
    category: 'Accident',
    months: [
      { month: 'Aug 2023', count: 3 }, { month: 'Sep 2023', count: 0 },
      { month: 'Oct 2023', count: 8 }, { month: 'Nov 2023', count: 0 },
      { month: 'Dec 2023', count: 0 }, { month: 'Jan 2024', count: 0 },
      { month: 'Feb 2024', count: 0 }, { month: 'Mar 2024', count: 5 },
      { month: 'Apr 2024', count: 0 }, { month: 'May 2024', count: 0 },
      { month: 'Jun 2024', count: 0 }, { month: 'Jul 2024', count: 2 },
    ],
    total: 36,
  },
  {
    category: 'Major',
    months: [
      { month: 'Aug 2023', count: 1 }, { month: 'Sep 2023', count: 0 },
      { month: 'Oct 2023', count: 1 }, { month: 'Nov 2023', count: 0 },
      { month: 'Dec 2023', count: 0 }, { month: 'Jan 2024', count: 0 },
      { month: 'Feb 2024', count: 0 }, { month: 'Mar 2024', count: 0 },
      { month: 'Apr 2024', count: 0 }, { month: 'May 2024', count: 0 },
      { month: 'Jun 2024', count: 0 }, { month: 'Jul 2024', count: 0 },
    ],
    total: 2,
  },
  {
    category: 'Fatality',
    months: MONTH_LABELS.map((m) => ({ month: m, count: 0 })),
    total: 0,
  },
];

const MOCK_HAZARD_TYPES: HazardTypeData[] = [
  { type: 'Biological', count: 26 },
  { type: 'Chemical', count: 9 },
  { type: 'Physical', count: 23 },
  { type: 'Mechanical', count: 191 },
  { type: 'Ergonomic', count: 2 },
  { type: 'Psychosocial', count: 2 },
];

const MOCK_NON_CONFORMANCE: NonConformanceCriteria[] = [
  { criteria: 'Required Document', count: 1 },
  { criteria: 'General Room and Floor Condition', count: 151 },
  { criteria: 'Work Station', count: 31 },
  { criteria: 'Elevator', count: 0 },
  { criteria: 'Parking Lot', count: 0 },
  { criteria: 'Electrical', count: 12 },
  { criteria: 'PPE', count: 3 },
  { criteria: 'Scaffolding', count: 2 },
  { criteria: '5S', count: 21 },
  { criteria: 'Environment', count: 30 },
  { criteria: 'Others', count: 4 },
];

const MOCK_RESPONSIBLE_ACTIONS: ResponsibleAction[] = [
  { action: 'Health and Safety', count: 16 },
  { action: 'Medical', count: 2 },
  { action: 'Campus Facility', count: 29 },
  { action: 'Building & Maintenance', count: 169 },
  { action: 'Security', count: 18 },
  { action: 'HR', count: 0 },
  { action: 'Others', count: 40 },
];

const MOCK_HAZARD_STATUS: HazardStatus = {
  open: 15,
  closed: 240,
  total: 255,
};

const MOCK_TOP_UNSAFE_CONDITIONS: TopUnsafeCondition[] = [
  { rank: 1, condition: 'Falling Object (roof tile, tree branches, ceiling)', reportCount: 50 },
  { rank: 2, condition: 'Stumble or fall due to different level of the floor/Uneven surface (Trip hazard)', reportCount: 36 },
  { rank: 3, condition: 'Slippery Floor', reportCount: 22 },
  { rank: 4, condition: 'Sharp edge material and nails left over scattered around the floor', reportCount: 21 },
  { rank: 5, condition: 'Emergency Exit and Fire extinguisher is block by furniture or goods / difficult to access', reportCount: 16 },
  { rank: 6, condition: 'Wild Animal (Snakes, Lizard, etc)', reportCount: 12 },
  { rank: 7, condition: 'Extension cord is not organized properly', reportCount: 10 },
  { rank: 8, condition: 'Bees', reportCount: 4 },
  { rank: 9, condition: 'Smell of burning wires', reportCount: 3 },
  { rank: 10, condition: 'Mosquito', reportCount: 2 },
];

const FISCAL_YEARS = ['2022-2023', '2023-2024', '2024-2025'];

/** Fiscal year to month labels: e.g. 2023-2024 -> Aug 2023 .. Jul 2024 */
const FISCAL_YEAR_MONTHS: Record<string, string[]> = {
  '2022-2023': ['Aug 2022', 'Sep 2022', 'Oct 2022', 'Nov 2022', 'Dec 2022', 'Jan 2023', 'Feb 2023', 'Mar 2023', 'Apr 2023', 'May 2023', 'Jun 2023', 'Jul 2023'],
  '2023-2024': MONTH_LABELS,
  '2024-2025': ['Aug 2024', 'Sep 2024', 'Oct 2024', 'Nov 2024', 'Dec 2024', 'Jan 2025', 'Feb 2025', 'Mar 2025', 'Apr 2025', 'May 2025', 'Jun 2025', 'Jul 2025'],
};

function filterMonthlyByParams(data: MonthlyHazardData[], params: HazardFilterParams): MonthlyHazardData[] {
  if (!params.periodStart && !params.periodEnd && params.month == null && params.year == null) {
    return data;
  }
  return data.map((row) => {
    let filteredMonths = row.months;
    if (params.periodStart || params.periodEnd) {
      const startIdx = params.periodStart ? FISCAL_YEARS.indexOf(params.periodStart) : 0;
      const endIdx = params.periodEnd ? FISCAL_YEARS.indexOf(params.periodEnd) : FISCAL_YEARS.length - 1;
      const monthsInRange = new Set<string>();
      for (let i = startIdx; i <= endIdx && i >= 0; i++) {
        const fyMonths = FISCAL_YEAR_MONTHS[FISCAL_YEARS[i]] ?? [];
        fyMonths.forEach((m) => monthsInRange.add(m));
      }
      filteredMonths = monthsInRange.size
        ? row.months.filter((m) => monthsInRange.has(m.month))
        : row.months;
    }
    if (params.month != null || params.year != null) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      filteredMonths = filteredMonths.filter((m) => {
        const parts = m.month.split(' ');
        const monthNum = monthNames.indexOf(parts[0]) + 1;
        const yearNum = parseInt(parts[1], 10);
        if (params.month != null && monthNum !== params.month) return false;
        if (params.year != null && yearNum !== params.year) return false;
        return true;
      });
    }
    const total = filteredMonths.reduce((sum, m) => sum + m.count, 0);
    return { ...row, months: filteredMonths, total };
  });
}

const hazardAnalyticsService = {
  getAnalyticsData: async (params?: HazardFilterParams): Promise<HazardAnalyticsData> => {
    const p = params ?? {};
    const monthlyHazards = filterMonthlyByParams(MOCK_MONTHLY_HAZARDS, p);
    return {
      incidentSummary: MOCK_INCIDENT_SUMMARY,
      monthlyHazards,
      hazardTypes: MOCK_HAZARD_TYPES,
      nonConformanceCriteria: MOCK_NON_CONFORMANCE,
      responsibleActions: MOCK_RESPONSIBLE_ACTIONS,
      hazardStatus: MOCK_HAZARD_STATUS,
      topUnsafeConditions: MOCK_TOP_UNSAFE_CONDITIONS,
    };
  },

  getFiscalYearOptions: (): { value: string; label: string }[] =>
    FISCAL_YEARS.map((y) => ({ value: y, label: y })),

  getPeriodOptions: (): { value: string; label: string }[] =>
    MONTH_LABELS.map((m) => ({ value: m, label: m })),

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
