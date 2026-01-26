import {
  Incident,
  CreateIncidentDTO,
  UpdateIncidentDTO,
} from '../types/incident.types';
import { PaginatedResponse, PaginationParams } from '@/core/lib/types';
import api from '@/core/lib/api';

const incidentsService = {
  getAll: async (
    params: PaginationParams & {
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
    // Serialize arrays for NestJS compatibility (NestJS expects ?status=OPEN&status=DRAFT format)
    const serializedParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // For arrays, add each value with the same key
          value.forEach(item => {
            serializedParams.append(key, String(item));
          });
        } else {
          serializedParams.append(key, String(value));
        }
      }
    });
    
    const response = await api.get(`/incidents?${serializedParams.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<Incident> => {
    const response = await api.get(`/incidents/${id}`);
    return response.data;
  },

  create: async (data: CreateIncidentDTO): Promise<Incident> => {
    const response = await api.post('/incidents', data);
    return response.data;
  },

  update: async (id: string, data: UpdateIncidentDTO): Promise<Incident> => {
    const response = await api.patch(`/incidents/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/incidents/${id}`);
  },

  submit: async (id: string): Promise<Incident> => {
    const response = await api.post(`/incidents/${id}/submit`);
    return response.data;
  },

  approve: async (id: string, notes?: string): Promise<Incident> => {
    const response = await api.post(`/incidents/${id}/approve`, { notes });
    return response.data;
  },

  reject: async (id: string, reason: string): Promise<Incident> => {
    const response = await api.post(`/incidents/${id}/reject`, { reason });
    return response.data;
  },

  checkApprovalRights: async (id: string): Promise<{
    canApprove: boolean;
    canReject: boolean;
    nextApprover: any;
  }> => {
    const response = await api.get(`/incidents/${id}/approval-rights`);
    return response.data;
  },

  getTimeline: async (id: string): Promise<any[]> => {
    const response = await api.get(`/incidents/${id}/timeline`);
    return response.data;
  },
};

export default incidentsService;
