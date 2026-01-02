/**
 * Audit Policy module types
 */

export enum TransitionTypeEnum {
  INITIAL = 'INITIAL',
  TRANSITION_LEVEL = 'TRANSITION_LEVEL',
  ADVANCE_LEVEL = 'ADVANCE_LEVEL',
}

export interface AuditElement {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditClause {
  id: string;
  name: string;
  code: string;
  description: string | null;
  auditElementId: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  auditElement?: AuditElement;
}

export interface AuditCriteria {
  id: string;
  name: string;
  code: string;
  description: string | null;
  auditClauseId: string;
  transitionType: TransitionTypeEnum;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  auditClause?: AuditClause;
}

export interface CreateAuditElementDTO {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateAuditElementDTO extends Partial<CreateAuditElementDTO> {}

export interface CreateAuditClauseDTO {
  name: string;
  code: string;
  description?: string;
  auditElementId: string;
  order: number;
  isActive?: boolean;
}

export interface UpdateAuditClauseDTO extends Partial<CreateAuditClauseDTO> {}

export interface CreateAuditCriteriaDTO {
  name: string;
  code: string;
  description?: string;
  auditClauseId: string;
  transitionType: TransitionTypeEnum;
  order: number;
  isActive?: boolean;
}

export interface UpdateAuditCriteriaDTO extends Partial<CreateAuditCriteriaDTO> {}