export interface IncidentCategoryData {
  category: string;
  year2022_2023: number;
  year2023_2024: number;
  year2024_2025: number;
}

export interface IncidentProfileFilterParams {
  /** Calendar month range start, YYYY-MM (e.g. 2022-01 for Jan 2022) */
  periodFrom?: string;
  /** Calendar month range end, YYYY-MM (e.g. 2022-12 for Dec 2022) */
  periodTo?: string;
}
