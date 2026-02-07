import type {
  SecurityTeamAnalyticsData,
  SecurityFilterParams,
  IncidentSummaryItem,
  MonthlyIncidentData,
  TypeNonConformanceItem,
  PartiesInvolvedItem,
  CaseStatus,
  SifrComparisonRow,
} from '../types/security-team.types';

const MOCK_INCIDENT_SUMMARY: IncidentSummaryItem[] = [
  { category: 'Major Incident', count: 24, difference: -24 },
  { category: 'Moderate Incident', count: 1, difference: -1 },
  { category: 'Minor Incident', count: 63, difference: -60 },
  { category: 'Total Incident', count: 88, difference: -77 },
];

const MONTH_LABELS_2024_2025 = [
  'Aug 2024', 'Sep 2024', 'Oct 2024', 'Nov 2024', 'Dec 2024', 'Jan 2025',
  'Feb 2025', 'Mar 2025', 'Apr 2025', 'May 2025', 'Jun 2025', 'Jul 2025',
];

const MOCK_MONTHLY_INCIDENTS: MonthlyIncidentData[] = [
  {
    category: 'Minor',
    months: [
      { month: 'Aug 2024', count: 3 }, { month: 'Sep 2024', count: 2 },
      { month: 'Oct 2024', count: 7 }, { month: 'Nov 2024', count: 13 },
      { month: 'Dec 2024', count: 4 }, { month: 'Jan 2025', count: 5 },
      { month: 'Feb 2025', count: 3 }, { month: 'Mar 2025', count: 5 },
      { month: 'Apr 2025', count: 2 }, { month: 'May 2025', count: 7 },
      { month: 'Jun 2025', count: 6 }, { month: 'Jul 2025', count: 6 },
    ],
    total: 63,
  },
  {
    category: 'Moderate',
    months: [
      { month: 'Aug 2024', count: 0 }, { month: 'Sep 2024', count: 0 },
      { month: 'Oct 2024', count: 0 }, { month: 'Nov 2024', count: 0 },
      { month: 'Dec 2024', count: 0 }, { month: 'Jan 2025', count: 0 },
      { month: 'Feb 2025', count: 0 }, { month: 'Mar 2025', count: 0 },
      { month: 'Apr 2025', count: 0 }, { month: 'May 2025', count: 0 },
      { month: 'Jun 2025', count: 1 }, { month: 'Jul 2025', count: 0 },
    ],
    total: 1,
  },
  {
    category: 'Major',
    months: [
      { month: 'Aug 2024', count: 2 }, { month: 'Sep 2024', count: 0 },
      { month: 'Oct 2024', count: 0 }, { month: 'Nov 2024', count: 4 },
      { month: 'Dec 2024', count: 1 }, { month: 'Jan 2025', count: 1 },
      { month: 'Feb 2025', count: 0 }, { month: 'Mar 2025', count: 6 },
      { month: 'Apr 2025', count: 2 }, { month: 'May 2025', count: 4 },
      { month: 'Jun 2025', count: 2 }, { month: 'Jul 2025', count: 2 },
    ],
    total: 24,
  },
  {
    category: 'Total Incident',
    months: [
      { month: 'Aug 2024', count: 5 }, { month: 'Sep 2024', count: 2 },
      { month: 'Oct 2024', count: 7 }, { month: 'Nov 2024', count: 17 },
      { month: 'Dec 2024', count: 5 }, { month: 'Jan 2025', count: 6 },
      { month: 'Feb 2025', count: 3 }, { month: 'Mar 2025', count: 11 },
      { month: 'Apr 2025', count: 4 }, { month: 'May 2025', count: 11 },
      { month: 'Jun 2025', count: 9 }, { month: 'Jul 2025', count: 8 },
    ],
    total: 88,
  },
];

const MOCK_TYPE_NON_CONFORMANCE: TypeNonConformanceItem[] = [
  { type: 'Inappropriate behavior (CP)', count: 14 },
  { type: 'Sabotage (Major)', count: 0 },
  { type: 'Confrontation / Assault (Major)', count: 2 },
  { type: 'External Dispute (Major)', count: 9 },
  { type: 'Trespasser / Intruder (Moderate)', count: 1 },
  { type: 'Internal Dispute', count: 2 },
  { type: 'Access Without RFID / Access Violence', count: 11 },
  { type: 'Traffic Violation', count: 5 },
  { type: 'Vandalism', count: 5 },
  { type: 'Theft', count: 1 },
  { type: 'Smoking / Vaping', count: 3 },
  { type: 'Lost and Found', count: 15 },
  { type: 'Others', count: 34 },
];

const MOCK_PARTIES_INVOLVED: PartiesInvolvedItem[] = [
  { party: 'Staff', count: 28 },
  { party: 'Students', count: 41 },
  { party: 'Parents / Family', count: 6 },
  { party: 'Household staff', count: 7 },
  { party: 'Visitors', count: 0 },
  { party: 'Vendors', count: 6 },
  { party: 'Contractors', count: 10 },
  { party: 'External', count: 10 },
  { party: 'Others', count: 4 },
];

const MOCK_CASE_STATUS: CaseStatus = {
  open: 1,
  closed: 99,
  total: 100,
};

const MOCK_SIFR_COMPARISON: SifrComparisonRow[] = [
  {
    year: '2023-2024',
    totalSifr: 1.37,
    majorRate: 0.35,
    moderateRate: 0.0,
    minorRate: 1.02,
  },
  {
    year: '2024-2025',
    totalSifr: 2.14,
    majorRate: 0.66,
    moderateRate: 0.02,
    minorRate: 1.68,
  },
];

const MONTH_ABBREV = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthLabelToKey(monthLabel: string): string {
  const parts = monthLabel.split(' ');
  const monthNum = MONTH_ABBREV.indexOf(parts[0]) + 1;
  const year = parts[1] ?? '';
  return `${year}-${String(monthNum).padStart(2, '0')}`;
}

function filterMonthlyByParams(data: MonthlyIncidentData[], params: SecurityFilterParams): MonthlyIncidentData[] {
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

const securityTeamService = {
  getAnalyticsData: async (params?: SecurityFilterParams): Promise<SecurityTeamAnalyticsData> => {
    const p = params ?? {};
    const monthlyIncidents = filterMonthlyByParams(MOCK_MONTHLY_INCIDENTS, p);
    return {
      incidentSummary: MOCK_INCIDENT_SUMMARY,
      monthlyIncidents,
      typeNonConformance: MOCK_TYPE_NON_CONFORMANCE,
      partiesInvolved: MOCK_PARTIES_INVOLVED,
      caseStatus: MOCK_CASE_STATUS,
      sifrComparison: MOCK_SIFR_COMPARISON,
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

export default securityTeamService;
