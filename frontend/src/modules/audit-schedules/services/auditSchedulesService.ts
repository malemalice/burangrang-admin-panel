import {
  AuditSchedule,
  CreateAuditScheduleDTO,
  UpdateAuditScheduleDTO,
} from '../types/audit-schedule.types';
import { PaginatedResponse, PaginationParams } from '@/core/lib/types';
import api from '@/core/lib/api';

const auditSchedulesService = {
  getAll: async (params: PaginationParams & {
    search?: string;
    isActive?: boolean;
    areaId?: string | string[];
    auditElementId?: string | string[];
    auditorIds?: string | string[];
    periodId?: string | string[];
    status?: string;
    createdAtFrom?: string;
    createdAtTo?: string;
    auditDateFrom?: string;
    auditDateTo?: string;
  }): Promise<PaginatedResponse<AuditSchedule>> => {
    // Build query params manually to ensure arrays are serialized correctly for NestJS
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.search?.trim()) queryParams.append('search', params.search.trim());
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.createdAtFrom) queryParams.append('createdAtFrom', params.createdAtFrom);
    if (params.createdAtTo) queryParams.append('createdAtTo', params.createdAtTo);
    if (params.auditDateFrom) queryParams.append('auditDateFrom', params.auditDateFrom);
    if (params.auditDateTo) queryParams.append('auditDateTo', params.auditDateTo);
    
    // Handle array parameters - append each value separately for NestJS to parse as array
    if (params.areaId) {
      const areaIds = Array.isArray(params.areaId) ? params.areaId : [params.areaId];
      areaIds.forEach(id => queryParams.append('areaId', id));
    }
    
    if (params.auditElementId) {
      const elementIds = Array.isArray(params.auditElementId) ? params.auditElementId : [params.auditElementId];
      elementIds.forEach(id => queryParams.append('auditElementId', id));
    }
    
    if (params.auditorIds) {
      const auditorIds = Array.isArray(params.auditorIds) ? params.auditorIds : [params.auditorIds];
      auditorIds.forEach(id => queryParams.append('auditorIds', id));
    }

    if (params.periodId) {
      const periodIds = Array.isArray(params.periodId) ? params.periodId : [params.periodId];
      periodIds.forEach(id => queryParams.append('periodId', id));
    }

    const response = await api.get(`/audit-schedules?${queryParams.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<AuditSchedule> => {
    const response = await api.get(`/audit-schedules/${id}`);
    return response.data;
  },

  create: async (data: CreateAuditScheduleDTO): Promise<AuditSchedule> => {
    const response = await api.post('/audit-schedules', data);
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateAuditScheduleDTO,
  ): Promise<AuditSchedule> => {
    const response = await api.patch(`/audit-schedules/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/audit-schedules/${id}`);
  },

  // Approval workflow methods
  submitForApproval: async (auditId: string, itemId: string): Promise<any> => {
    const response = await api.post(`/audit-schedules/${auditId}/items/${itemId}/submit-for-approval`);
    return response.data;
  },

  approveAuditItem: async (
    auditId: string,
    itemId: string,
    notes?: string,
  ): Promise<any> => {
    const response = await api.post(`/audit-schedules/${auditId}/items/${itemId}/approve`, { notes });
    return response.data;
  },

  rejectAuditItem: async (
    auditId: string,
    itemId: string,
    notes: string,
  ): Promise<any> => {
    const response = await api.post(`/audit-schedules/${auditId}/items/${itemId}/reject`, { notes });
    return response.data;
  },

  checkApprovalRights: async (auditId: string, itemId: string): Promise<any> => {
    const response = await api.get(`/audit-schedules/${auditId}/items/${itemId}/approval-rights`);
    return response.data;
  },
};

export default auditSchedulesService;
