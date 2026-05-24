export type WaterQualityLabReportCategory =
  | 'WASTEWATER'
  | 'CLEAN_WATER'
  | 'SWIMMING_POOL_WATER'
  | 'DRINKING_WATER';

export interface WaterQualityDashboardParameter {
  id: string;
  name: string;
  code: string;
  unit: string;
  standardLimit: number | null;
  regulatoryLimit: number | null;
  displayOrder: number | null;
}

export interface WaterQualityDashboardPlant {
  id: string;
  name: string;
  code: string;
}

export interface WaterQualityDashboardMonth {
  month: number;
  values: Record<string, number | null>;
}

export interface WaterQualityDashboardData {
  category: WaterQualityLabReportCategory;
  year: number;
  parameter: WaterQualityDashboardParameter | null;
  availableParameters: WaterQualityDashboardParameter[];
  plants: WaterQualityDashboardPlant[];
  months: WaterQualityDashboardMonth[];
  averageValue: number | null;
  trendline: { slope: number; intercept: number } | null;
  yearSummary: { count: number; average: number | null };
}

export interface WaterQualityDashboardQuery {
  category: WaterQualityLabReportCategory;
  year: number;
  parameterId?: string;
}
