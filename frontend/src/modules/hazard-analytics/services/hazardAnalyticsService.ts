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

const MONTH_ABBREV = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthLabelToKey(monthLabel: string): string {
  const parts = monthLabel.split(' ');
  const monthNum = MONTH_ABBREV.indexOf(parts[0]) + 1;
  const year = parts[1] ?? '';
  return `${year}-${String(monthNum).padStart(2, '0')}`;
}

function filterMonthlyByParams(data: MonthlyHazardData[], params: HazardFilterParams): MonthlyHazardData[] {
  if (!params.periodFrom && !params.periodTo) {
    return data;
  }
  const from = params.periodFrom ?? '0000-00';
  const to = params.periodTo ?? '9999-99';
  return data.map((row) => {
    const filteredMonths = row.months.filter((m) => {
      const key = monthLabelToKey(m.month);
      return key >= from && key <= to;
    });
    const total = filteredMonths.reduce((sum, m) => sum + m.count, 0);
    return { ...row, months: filteredMonths, total };
  });
}

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

  getAnalyticsData: async (params?: HazardFilterParams): Promise<HazardAnalyticsData> => {
    const p = params ?? {};
    const incidentSummary = await hazardAnalyticsService.getIncidentSummary(p);
    const monthlyHazards = filterMonthlyByParams(MOCK_MONTHLY_HAZARDS, p);
    return {
      incidentSummary,
      monthlyHazards,
      hazardTypes: MOCK_HAZARD_TYPES,
      nonConformanceCriteria: MOCK_NON_CONFORMANCE,
      responsibleActions: MOCK_RESPONSIBLE_ACTIONS,
      hazardStatus: MOCK_HAZARD_STATUS,
      topUnsafeConditions: MOCK_TOP_UNSAFE_CONDITIONS,
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
