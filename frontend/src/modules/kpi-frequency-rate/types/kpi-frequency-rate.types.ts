export interface KpiDataPoint {
  year: string;
  studyRelated: number;
  workRelated: number;
  total: number;
}

export interface KpiFrequencyRateData {
  trifr: KpiDataPoint[];
  trsr: KpiDataPoint[];
  lticr: KpiDataPoint[];
}

export interface KpiFilterParams {
  periodStart?: string;
  periodEnd?: string;
  month?: number;
  year?: number;
}
