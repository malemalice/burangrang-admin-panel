import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';
import { User } from '@/core/lib/types';
import { AuditSchedule } from '@/modules/audit-schedules/types/audit-schedule.types';

export interface AuditPeriod {
  id: string;
  month: number;
  year: number;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  creator?: User;
  audits?: AuditSchedule[];
  totalAudits: number;
  completedAudits: number;
}

export interface CreateAuditPeriodDTO {
  month: number;
  year: number;
  notes?: string;
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatPeriodLabel(month: number, year: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}
