/**
 * Man Hour module types
 */

export type ManHourGroup = 'STUDENT' | 'NON_STUDENT';

export type Month = 'JAN' | 'FEB' | 'MAR' | 'APR' | 'MAY' | 'JUN' | 'JUL' | 'AUG' | 'SEP' | 'OCT' | 'NOV' | 'DEC';

export interface ManHour {
  id: string;
  name: string;
  group: ManHourGroup;
  qty: number;
  manHourPerDay: number;
  month: Month;
  year: number;
  totalWorkingDays: number;
  lostHour: number;
  total: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateManHourDTO {
  name: string;
  group: ManHourGroup;
  qty: number;
  manHourPerDay: number;
  month: Month;
  year: number;
  lostHour?: number;
  total?: number;
  notes?: string;
}

export interface UpdateManHourDTO {
  name?: string;
  group?: ManHourGroup;
  qty?: number;
  manHourPerDay?: number;
  month?: Month;
  year?: number;
  lostHour?: number;
  total?: number;
  notes?: string;
  isActive?: boolean;
}

export interface ManHourFilters {
  month?: Month;
  year?: number;
  group?: ManHourGroup;
  isActive?: boolean;
  search?: string;
}

// Report types
export interface ManHourReportRow {
  name: string;
  group: ManHourGroup;
  studyHour: number;
  monthlyData: Record<string, { qty: number; total: number }>;
  yearlyTotal: number;
}

export interface ManHourReport {
  rows: ManHourReportRow[];
  grandTotals: Record<string, number>;
  totalStudentHour: number;
  totalAccumulationStudentHour: number;
}

// Month display mapping
export const MONTH_LABELS: Record<Month, string> = {
  JAN: 'January',
  FEB: 'February',
  MAR: 'March',
  APR: 'April',
  MAY: 'May',
  JUN: 'June',
  JUL: 'July',
  AUG: 'August',
  SEP: 'September',
  OCT: 'October',
  NOV: 'November',
  DEC: 'December',
};

export const MONTH_SHORT_LABELS: Record<Month, string> = {
  JAN: 'Jan',
  FEB: 'Feb',
  MAR: 'Mar',
  APR: 'Apr',
  MAY: 'May',
  JUN: 'Jun',
  JUL: 'Jul',
  AUG: 'Aug',
  SEP: 'Sep',
  OCT: 'Oct',
  NOV: 'Nov',
  DEC: 'Dec',
};

export const MONTHS: Month[] = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export const GROUP_LABELS: Record<ManHourGroup, string> = {
  STUDENT: 'Student',
  NON_STUDENT: 'Non-Student',
};
