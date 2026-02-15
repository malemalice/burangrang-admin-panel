/** Category plus one number per fiscal year key (e.g. year2020_2021, ...). */
export interface IncidentCategoryData {
  category: string;
  [fyKey: string]: string | number;
}

const FISCAL_YEAR_START = 2020;

/** Fiscal year options from 2020-2021 through current FY (Aug–Jul). */
export function getFiscalYearOptions(): { value: string; label: string }[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const currentFY = month >= 8 ? year : year - 1;
  const options: { value: string; label: string }[] = [];
  for (let y = FISCAL_YEAR_START; y <= currentFY; y++) {
    options.push({ value: `year${y}_${y + 1}`, label: `${y}-${y + 1}` });
  }
  return options;
}

export type FiscalYearKey = string;

export interface IncidentProfileFilterParams {
  /** Fiscal years to compare (e.g. ['year2022_2023', 'year2023_2024']) */
  fiscalYears?: string[];
}

export interface IncidentProfileData {
  countData: IncidentCategoryData[];
  percentageData: IncidentCategoryData[];
  yearsToShow: string[];
}
