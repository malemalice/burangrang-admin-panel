/**
 * KPI HSE Target module types
 */

export type HseTargetType = 'INCIDENT' | 'RISK' | 'INSPECTION' | 'AUDIT';

export type Month = 'JAN' | 'FEB' | 'MAR' | 'APR' | 'MAY' | 'JUN' | 'JUL' | 'AUG' | 'SEP' | 'OCT' | 'NOV' | 'DEC';

export interface HseTarget {
  id: string;
  type: HseTargetType;
  code: string;
  name?: string;
  month?: Month;
  year: number;
  target: number;
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

export interface CreateHseTargetDTO {
  type: HseTargetType;
  code: string;
  name?: string;
  month?: Month;
  year: number;
  target: number;
  isActive?: boolean;
}

export interface UpdateHseTargetDTO {
  type?: HseTargetType;
  code?: string;
  name?: string;
  month?: Month;
  year?: number;
  target?: number;
  isActive?: boolean;
}

export interface HseTargetFilters {
  type?: HseTargetType;
  code?: string;
  month?: Month;
  year?: number;
  isActive?: boolean;
  search?: string;
}

// Type labels
export const TYPE_LABELS: Record<HseTargetType, string> = {
  INCIDENT: 'Incident',
  RISK: 'Risk',
  INSPECTION: 'Inspection',
  AUDIT: 'Audit',
};

// Code options per type (for form dropdowns)
export const CODE_OPTIONS: Record<HseTargetType, Array<{ value: string; label: string }>> = {
  INCIDENT: [
    { value: 'FATALITY', label: 'Fatality' },
    { value: 'MAJOR', label: 'Major' },
    { value: 'MINOR', label: 'Minor' },
    { value: 'NEAR_MISS', label: 'Near Miss' },
  ],
  RISK: [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'EXTREME', label: 'Extreme' },
  ],
  INSPECTION: [
    { value: 'SCHEDULED', label: 'Scheduled' },
  ],
  AUDIT: [
    { value: 'COMPLIANCE', label: 'Compliance' },
  ],
};

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
