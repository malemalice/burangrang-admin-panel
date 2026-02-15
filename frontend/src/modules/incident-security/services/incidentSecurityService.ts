import {
  Incident,
  CreateIncidentDTO,
  UpdateIncidentDTO,
  IncidentActivitiesEnum,
} from '../types/incidentSecurity.types';
import { PaginatedResponse, PaginationParams } from '@/core/lib/types';
import api from '@/core/lib/api';

const incidentSecurityService = {
  getAll: async (
    params: PaginationParams & {
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      isActive?: boolean;
      areaId?: string | string[];
      riskCategoryId?: string | string[];
      status?: string | string[];
      incidentType?: string | string[];
      incidentClassification?: string;
      priority?: string | string[];
      source?: string;
      assignedDepartmentId?: string | string[];
      assigneeId?: string | string[];
      search?: string;
    },
  ): Promise<PaginatedResponse<Incident>> => {
    const serializedParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => {
            serializedParams.append(key, String(item));
          });
        } else {
          serializedParams.append(key, String(value));
        }
      }
    });

    const response = await api.get(`/incident-securities?${serializedParams.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<Incident> => {
    const response = await api.get(`/incident-securities/${id}`);
    return response.data;
  },

  create: async (data: CreateIncidentDTO): Promise<Incident> => {
    const response = await api.post('/incident-securities', data);
    return response.data;
  },

  update: async (id: string, data: UpdateIncidentDTO): Promise<Incident> => {
    const response = await api.patch(`/incident-securities/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/incident-securities/${id}`);
  },

  submit: async (id: string): Promise<Incident> => {
    const response = await api.post(`/incident-securities/${id}/submit`);
    return response.data;
  },

  approve: async (
    id: string,
    notes?: string,
    activities?: IncidentActivitiesEnum,
  ): Promise<Incident> => {
    const response = await api.post(`/incident-securities/${id}/approve`, {
      notes,
      activities,
    });
    return response.data;
  },

  reject: async (id: string, reason: string): Promise<Incident> => {
    const response = await api.post(`/incident-securities/${id}/reject`, { reason });
    return response.data;
  },

  checkApprovalRights: async (id: string): Promise<{
    canApprove: boolean;
    canReject: boolean;
    nextApprover: any;
  }> => {
    const response = await api.get(`/incident-securities/${id}/approval-rights`);
    return response.data;
  },

  getTimeline: async (id: string): Promise<any[]> => {
    const response = await api.get(`/incident-securities/${id}/timeline`);
    return response.data;
  },
};

export default incidentSecurityService;
