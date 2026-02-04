export interface IncidentCategoryData {
  category: string;
  year2022_2023: number;
  year2023_2024: number;
  year2024_2025: number;
}

export interface IncidentProfileFilterParams {
  periodStart?: string;
  periodEnd?: string;
  month?: number;
  year?: number;
}
