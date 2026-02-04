export interface HazardFilterParams {
  periodStart?: string;
  periodEnd?: string;
  month?: number;
  year?: number;
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
