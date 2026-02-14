export interface SecurityFilterParams {
  /** Calendar month range start, YYYY-MM (e.g. 2022-01 for Jan 2022) */
  periodFrom?: string;
  /** Calendar month range end, YYYY-MM (e.g. 2022-12 for Dec 2022) */
  periodTo?: string;
}

export interface IncidentSummaryItem {
  category: string;
  count: number;
  difference: number;
}

export interface MonthlyIncidentData {
  category: string;
  months: { month: string; count: number }[];
  total: number;
}

export interface TypeNonConformanceItem {
  type: string;
  count: number;
}

export interface PartiesInvolvedItem {
  party: string;
  count: number;
}

export interface CaseStatus {
  open: number;
  closed: number;
  total: number;
}

export interface SifrComparisonRow {
  year: string;
  totalSifr: number;
  majorRate: number;
  moderateRate: number;
  minorRate: number;
}

export interface SecurityTeamAnalyticsData {
  incidentSummary: IncidentSummaryItem[];
  monthlyIncidents: MonthlyIncidentData[];
  typeNonConformance: TypeNonConformanceItem[];
  partiesInvolved: PartiesInvolvedItem[];
  caseStatus: CaseStatus;
  sifrComparison: SifrComparisonRow[];
}
