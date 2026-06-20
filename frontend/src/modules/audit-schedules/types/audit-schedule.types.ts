/**
 * Audit module types
 * Following TRD.md module structure template
 */

import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';
import type { AreaDTO } from '@/modules/master-data/types/master-data.types';
import { User } from '@/core/lib/types';

export interface AuditElement {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

export interface AuditSchedule {
  id: string;
  code: string;
  areaIds?: string[];
  areas?: AreaDTO[];
  auditDate: Date;
  auditElementId: string;
  auditElement?: AuditElement;
  status: GeneralStatusEnum;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  creator?: User;
  auditors?: User[];
  auditPeriodId?: string;
  period?: { id: string; month: number; year: number };
}

export interface CreateAuditScheduleDTO {
  code: string;
  areaIds: string[];
  auditDate: Date;
  auditElementId: string;
  auditPeriodId: string;
  status?: GeneralStatusEnum; // Optional - auto-determined by backend based on audit date
  isActive?: boolean;
  auditorIds?: string[];
}

export type UpdateAuditScheduleDTO = Partial<CreateAuditScheduleDTO>;
