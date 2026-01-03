/**
 * Audit Criteria module types
 */

// Re-export core types that are used by audit criteria module
export type { PaginatedResponse, PaginationParams } from '@/core/lib/types';

// Interface for audit criteria data from API that matches backend structure
export interface AuditCriteriaDTO {
  id: string;
  name: string;
  code: string;
  description: string | null;
  auditClauseId: string;
  transitionType: 'INITIAL' | 'TRANSITION_LEVEL' | 'ADVANCE_LEVEL';
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  auditClause?: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    auditElementId: string;
    order: number;
    isActive: boolean;
    auditElement?: {
      id: string;
      name: string;
      code: string;
      description: string | null;
      isActive: boolean;
    };
  };
}

// Frontend model for audit criteria
export interface AuditCriteria {
  id: string;
  name: string;
  code: string;
  description: string | null;
  auditClauseId: string;
  clauseName: string;
  auditElementId: string;
  elementName: string;
  transitionType: 'INITIAL' | 'TRANSITION_LEVEL' | 'ADVANCE_LEVEL';
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface for creating an audit criteria
export interface CreateAuditCriteriaDTO {
  name: string;
  code?: string;
  description?: string;
  auditClauseId: string;
  transitionType: 'INITIAL' | 'TRANSITION_LEVEL' | 'ADVANCE_LEVEL';
  order: number;
  isActive?: boolean;
}

// Interface for updating an audit criteria
export interface UpdateAuditCriteriaDTO {
  name?: string;
  description?: string;
  auditClauseId?: string;
  transitionType?: 'INITIAL' | 'TRANSITION_LEVEL' | 'ADVANCE_LEVEL';
  order?: number;
  isActive?: boolean;
}

// Audit criteria filter options
export interface AuditCriteriaFilters {
  transitionType?: 'INITIAL' | 'TRANSITION_LEVEL' | 'ADVANCE_LEVEL';
  criteriaName?: string;
  auditClauseId?: string;
  auditElementId?: string;
  isActive?: boolean;
}

// Audit criteria search parameters
export interface AuditCriteriaSearchParams extends PaginationParams {
  filters?: AuditCriteriaFilters;
}
