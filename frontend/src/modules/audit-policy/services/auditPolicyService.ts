import { PaginatedResponse, PaginationParams } from '@/core/lib/types';
import api from '@/core/lib/api';
import {
  AuditElement,
  AuditClause,
  AuditCriteria,
  CreateAuditElementDTO,
  UpdateAuditElementDTO,
  CreateAuditClauseDTO,
  UpdateAuditClauseDTO,
  CreateAuditCriteriaDTO,
  UpdateAuditCriteriaDTO,
  TransitionTypeEnum,
} from '../types/audit-policy.types';

export interface AuditElementPaginationParams extends PaginationParams {
  isActive?: boolean;
  search?: string;
}

export interface AuditClausePaginationParams extends PaginationParams {
  isActive?: boolean;
  search?: string;
  auditElementId?: string;
}

export interface AuditCriteriaPaginationParams extends PaginationParams {
  isActive?: boolean;
  search?: string;
  auditClauseId?: string;
  transitionType?: TransitionTypeEnum;
}

const auditPolicyService = {
  // Audit Elements
  getElements: async (params?: AuditElementPaginationParams): Promise<PaginatedResponse<AuditElement>> => {
    const response = await api.get('/audit-elements', { params });
    return response.data;
  },

  getElementById: async (id: string): Promise<AuditElement> => {
    const response = await api.get(`/audit-elements/${id}`);
    return response.data;
  },

  createElement: async (data: CreateAuditElementDTO): Promise<AuditElement> => {
    const response = await api.post('/audit-elements', data);
    return response.data;
  },

  updateElement: async (id: string, data: UpdateAuditElementDTO): Promise<AuditElement> => {
    const response = await api.patch(`/audit-elements/${id}`, data);
    return response.data;
  },

  deleteElement: async (id: string): Promise<void> => {
    await api.delete(`/audit-elements/${id}`);
  },

  // Audit Clauses
  getClauses: async (params?: AuditClausePaginationParams): Promise<PaginatedResponse<AuditClause>> => {
    const response = await api.get('/audit-clauses', { params });
    return response.data;
  },

  getClauseById: async (id: string): Promise<AuditClause> => {
    const response = await api.get(`/audit-clauses/${id}`);
    return response.data;
  },

  createClause: async (data: CreateAuditClauseDTO): Promise<AuditClause> => {
    const response = await api.post('/audit-clauses', data);
    return response.data;
  },

  updateClause: async (id: string, data: UpdateAuditClauseDTO): Promise<AuditClause> => {
    const response = await api.patch(`/audit-clauses/${id}`, data);
    return response.data;
  },

  deleteClause: async (id: string): Promise<void> => {
    await api.delete(`/audit-clauses/${id}`);
  },

  // Audit Criteria
  getCriteria: async (params?: AuditCriteriaPaginationParams): Promise<PaginatedResponse<AuditCriteria>> => {
    const response = await api.get('/audit-criteria', { params });
    return response.data;
  },

  getCriterionById: async (id: string): Promise<AuditCriteria> => {
    const response = await api.get(`/audit-criteria/${id}`);
    return response.data;
  },

  createCriterion: async (data: CreateAuditCriteriaDTO): Promise<AuditCriteria> => {
    const response = await api.post('/audit-criteria', data);
    return response.data;
  },

  updateCriterion: async (id: string, data: UpdateAuditCriteriaDTO): Promise<AuditCriteria> => {
    const response = await api.patch(`/audit-criteria/${id}`, data);
    return response.data;
  },

  deleteCriterion: async (id: string): Promise<void> => {
    await api.delete(`/audit-criteria/${id}`);
  },

  // Code Regeneration
  regenerateClauseCodes: async (auditElementId: string): Promise<void> => {
    await api.post(`/audit-clauses/regenerate-codes/${auditElementId}`);
  },

  regenerateCriteriaCodes: async (auditClauseId: string): Promise<void> => {
    await api.post(`/audit-criteria/regenerate-codes/${auditClauseId}`);
  },
};

export default auditPolicyService;