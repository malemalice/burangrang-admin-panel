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
  /** Calendar month range start, YYYY-MM (e.g. 2022-01 for Jan 2022) */
  periodFrom?: string;
  /** Calendar month range end, YYYY-MM (e.g. 2022-12 for Dec 2022) */
  periodTo?: string;
}
