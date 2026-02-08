export interface IncidentCategoryData {
  category: string;
  year2022_2023: number;
  year2023_2024: number;
  year2024_2025: number;
}

export const FISCAL_YEAR_OPTIONS = [
  { value: 'year2022_2023', label: '2022-2023' },
  { value: 'year2023_2024', label: '2023-2024' },
  { value: 'year2024_2025', label: '2024-2025' },
] as const;

export type FiscalYearKey = (typeof FISCAL_YEAR_OPTIONS)[number]['value'];

export interface IncidentProfileFilterParams {
  /** Fiscal years to compare (e.g. ['year2022_2023', 'year2023_2024']) */
  fiscalYears?: string[];
}

export interface IncidentProfileData {
  countData: IncidentCategoryData[];
  percentageData: IncidentCategoryData[];
  yearsToShow: string[];
}
