export interface HazardFilterParams {
  /** Calendar month range start, YYYY-MM (e.g. 2022-01 for Jan 2022) */
  periodFrom?: string;
  /** Calendar month range end, YYYY-MM (e.g. 2022-12 for Dec 2022) */
  periodTo?: string;
}

export interface IncidentSummary {
  category: string;
  actual: number;
  target: number;
}

export interface MonthlyHazardData {
  category: string;
  months: { month: string; count: number }[];
  total: number;
}

export interface HazardTypeData {
  type: string;
  count: number;
}

export interface NonConformanceCriteria {
  criteria: string;
  count: number;
}

export interface ResponsibleAction {
  action: string;
  count: number;
}

export interface HazardStatus {
  open: number;
  closed: number;
  total: number;
}

export interface TopUnsafeCondition {
  rank: number;
  condition: string;
  reportCount: number;
}

export interface HazardAnalyticsData {
  incidentSummary: IncidentSummary[];
  monthlyHazards: MonthlyHazardData[];
  hazardTypes: HazardTypeData[];
  nonConformanceCriteria: NonConformanceCriteria[];
  responsibleActions: ResponsibleAction[];
  hazardStatus: HazardStatus;
  topUnsafeConditions: TopUnsafeCondition[];
}
