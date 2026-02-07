export interface SecurityFilterParams {
  periodStart?: string;
  periodEnd?: string;
  month?: number;
  year?: number;
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
