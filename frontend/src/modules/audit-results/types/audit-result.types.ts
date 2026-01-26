/**
 * Audit Result module types
 */

import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';
import { CompliantStatusEnum, COMPLIANT_STATUS_OPTIONS } from '@/shared/constants/compliant-status.enum';

export { CompliantStatusEnum, COMPLIANT_STATUS_OPTIONS };

export interface AuditElement {
  id: string;
  name: string;
  code: string;
}

export interface AuditClause {
  id: string;
  name: string;
  code: string;
}

export interface AuditCriteria {
  id: string;
  name: string;
  code: string;
}

export interface AuditResult {
  id: string;
  auditId: string;
  auditScheduleCode: string;
  auditElement: AuditElement;
  auditClause: AuditClause;
  auditCriteria: AuditCriteria;
  status: GeneralStatusEnum;
  compliantStatus: CompliantStatusEnum;
  evidence?: string;
  recommendation?: string;
  actionRealization?: string;
  order: number;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
  departmentIds?: string[];
  userIds?: string[];
}
