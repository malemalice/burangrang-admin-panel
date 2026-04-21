import api from '@/core/lib/api';
import { PaginatedResponse } from '@/core/lib/types';
import {
  WorkPermit,
  WorkPermitDTO,
  CreateWorkPermitDTO,
  UpdateWorkPermitDTO,
  WorkPermitSearchParams,
  ApprovalTimelineItem,
  WorkPermitMasterData,
  MasterDataOption,
  ClassificationSafetyGuidanceUpdate,
  mapWorkPermitDtoToWorkPermit,
  mapWorkPermitToUpdateDto,
} from '../types/work-permit.types';

const workPermitService = {
  /**
   * Get all work permits with pagination and filtering
   */
  getWorkPermits: async (params: WorkPermitSearchParams): Promise<PaginatedResponse<WorkPermit>> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.status) queryParams.append('status', params.status);
    if (params.companyId) queryParams.append('companyId', params.companyId);
    if (params.areaId) queryParams.append('areaId', params.areaId);
    if (params.createdBy) queryParams.append('createdBy', params.createdBy);
    if (params.startDateFrom) queryParams.append('startDateFrom', params.startDateFrom);
    if (params.startDateTo) queryParams.append('startDateTo', params.startDateTo);
    if (params.endDateFrom) queryParams.append('endDateFrom', params.endDateFrom);
    if (params.endDateTo) queryParams.append('endDateTo', params.endDateTo);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const response = await api.get(`/work-permits?${queryParams.toString()}`);
    return {
      data: response.data.data.map(mapWorkPermitDtoToWorkPermit),
      meta: response.data.meta,
    };
  },

  /**
   * Get work permit by ID
   */
  getWorkPermitById: async (id: string): Promise<WorkPermit> => {
    const response = await api.get(`/work-permits/${id}`);
    return mapWorkPermitDtoToWorkPermit(response.data);
  },

  /**
   * Create new work permit
   */
  createWorkPermit: async (data: CreateWorkPermitDTO): Promise<WorkPermit> => {
    const response = await api.post('/work-permits', data);
    return mapWorkPermitDtoToWorkPermit(response.data);
  },

  /**
   * Update work permit
   */
  updateWorkPermit: async (id: string, data: UpdateWorkPermitDTO): Promise<WorkPermit> => {
    const response = await api.patch(`/work-permits/${id}`, data);
    return mapWorkPermitDtoToWorkPermit(response.data);
  },

  /**
   * Delete work permit (soft delete)
   */
  deleteWorkPermit: async (id: string): Promise<void> => {
    await api.delete(`/work-permits/${id}`);
  },

  /**
   * Submit work permit for approval
   */
  submitWorkPermit: async (id: string, notes?: string): Promise<WorkPermit> => {
    const response = await api.post(`/work-permits/${id}/submit`, { notes });
    return mapWorkPermitDtoToWorkPermit(response.data);
  },

  /**
   * Approve work permit
   */
  approveWorkPermit: async (
    id: string,
    payload?: {
      notes?: string;
      classificationSafetyGuidance?: ClassificationSafetyGuidanceUpdate[];
      requireCourseVerification?: boolean;
      requiredCourses?: Array<{ courseId: string; isRequired?: boolean; order: number }>;
    },
  ): Promise<WorkPermit> => {
    const response = await api.post(`/work-permits/${id}/approve`, {
      notes: payload?.notes,
      classificationSafetyGuidance: payload?.classificationSafetyGuidance,
      requireCourseVerification: payload?.requireCourseVerification,
      requiredCourses: payload?.requiredCourses,
    });
    return mapWorkPermitDtoToWorkPermit(response.data);
  },

  /**
   * Applicant signs/acknowledges HSE safety guideline (SK)
   */
  signSk: async (id: string, signature?: string): Promise<WorkPermit> => {
    const response = await api.post(`/work-permits/${id}/sign-sk`, { signature });
    return mapWorkPermitDtoToWorkPermit(response.data);
  },

  /**
   * Reject work permit
   */
  rejectWorkPermit: async (id: string, reason: string, notes?: string): Promise<WorkPermit> => {
    const response = await api.post(`/work-permits/${id}/reject`, { reason, notes });
    return mapWorkPermitDtoToWorkPermit(response.data);
  },

  /**
   * Request additional information
   */
  requestInfo: async (id: string, message: string, ccUserIds?: string[], notes?: string): Promise<WorkPermit> => {
    const response = await api.post(`/work-permits/${id}/request-info`, {
      message,
      ccUserIds,
      notes,
    });
    return mapWorkPermitDtoToWorkPermit(response.data);
  },

  /**
   * Extend work permit
   */
  extendWorkPermit: async (id: string, newEndDate: string, reason: string, notes?: string): Promise<WorkPermit> => {
    const response = await api.post(`/work-permits/${id}/extend`, {
      newEndDate,
      reason,
      notes,
    });
    return mapWorkPermitDtoToWorkPermit(response.data);
  },

  /**
   * Close work permit
   */
  closeWorkPermit: async (id: string, notes?: string): Promise<WorkPermit> => {
    const response = await api.post(`/work-permits/${id}/close`, { notes });
    return mapWorkPermitDtoToWorkPermit(response.data);
  },

  /**
   * Check approval rights for the current user
   */
  checkApprovalRights: async (id: string): Promise<{
    canApprove: boolean;
    canReject: boolean;
    canRequestInfo: boolean;
    nextApprover: {
      line: number;
      department: { name: string };
      jobPosition: { name: string };
    } | null;
  }> => {
    const response = await api.get(`/work-permits/${id}/approval-rights`);
    return response.data;
  },

  /**
   * Get approval timeline
   */
  getTimeline: async (id: string): Promise<ApprovalTimelineItem[]> => {
    const response = await api.get(`/work-permits/${id}/timeline`);
    return response.data;
  },

  /**
   * Get master data for work permit form
   */
  getMasterData: async (): Promise<WorkPermitMasterData> => {
    const response = await api.get('/work-permits/master-data');
    return response.data;
  },

  /**
   * Create profession master data (from work permit form when no match exists)
   */
  createProfession: async (data: {
    name: string;
    code?: string;
    description?: string;
  }): Promise<{ id: string; name: string; code: string }> => {
    const response = await api.post('/work-permits/professions', data);
    return response.data;
  },

  /**
   * Create tool master data (from work permit form when no match exists)
   */
  createTool: async (data: {
    name: string;
    code?: string;
    description?: string;
  }): Promise<MasterDataOption> => {
    const response = await api.post('/work-permits/tools', data);
    return response.data;
  },

  /**
   * Create material master data (from work permit form when no match exists)
   */
  createMaterial: async (data: {
    name: string;
    code?: string;
    description?: string;
  }): Promise<MasterDataOption> => {
    const response = await api.post('/work-permits/materials', data);
    return response.data;
  },

  /**
   * Create machine master data (from work permit form when no match exists)
   */
  createMachine: async (data: {
    name: string;
    code?: string;
    description?: string;
  }): Promise<MasterDataOption> => {
    const response = await api.post('/work-permits/machines', data);
    return response.data;
  },

  /**
   * Create heavy equipment master data (from work permit form when no match exists)
   * Note: backend sets `isFallbackCreated = true` for this route.
   */
  createHeavyEquipment: async (data: {
    name: string;
    code?: string;
    description?: string;
  }): Promise<MasterDataOption> => {
    const response = await api.post('/work-permits/heavy-equipment', data);
    return response.data;
  },
};

export default workPermitService;
export type { CreateWorkPermitDTO, UpdateWorkPermitDTO };
