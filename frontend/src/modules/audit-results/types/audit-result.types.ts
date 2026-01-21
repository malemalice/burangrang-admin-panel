/**
 * Audit Result module types
 */

import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';

export enum CompliantStatusEnum {
  COMPLY = 'COMPLY',
  NOT_COMPLY_MAJOR = 'NOT_COMPLY_MAJOR',
  NOT_COMPLY_MINOR = 'NOT_COMPLY_MINOR',
}

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

export const COMPLIANT_STATUS_OPTIONS = [
  { label: 'Comply', value: CompliantStatusEnum.COMPLY },
  { label: 'Not Comply - Major', value: CompliantStatusEnum.NOT_COMPLY_MAJOR },
  { label: 'Not Comply - Minor', value: CompliantStatusEnum.NOT_COMPLY_MINOR },
];
