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

const FISCAL_YEARS = ['2022-2023', '2023-2024', '2024-2025'];

const FISCAL_YEAR_MONTHS: Record<string, string[]> = {
  '2022-2023': ['Aug 2022', 'Sep 2022', 'Oct 2022', 'Nov 2022', 'Dec 2022', 'Jan 2023', 'Feb 2023', 'Mar 2023', 'Apr 2023', 'May 2023', 'Jun 2023', 'Jul 2023'],
  '2023-2024': ['Aug 2023', 'Sep 2023', 'Oct 2023', 'Nov 2023', 'Dec 2023', 'Jan 2024', 'Feb 2024', 'Mar 2024', 'Apr 2024', 'May 2024', 'Jun 2024', 'Jul 2024'],
  '2024-2025': MONTH_LABELS_2024_2025,
};

function filterMonthlyByParams(data: MonthlyIncidentData[], params: SecurityFilterParams): MonthlyIncidentData[] {
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
    [2022, 2023, 2024, 2025].map((y) => ({ value: y, label: String(y) })),
};

export default securityTeamService;
