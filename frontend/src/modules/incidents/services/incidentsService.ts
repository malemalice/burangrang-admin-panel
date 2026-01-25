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
      areaId?: string;
      riskCategoryId?: string;
      status?: string;
      incidentType?: string;
      incidentClassification?: string;
      priority?: string;
      source?: string;
      assignedDepartmentId?: string;
      assigneeId?: string;
      search?: string;
    },
  ): Promise<PaginatedResponse<Incident>> => {
    const response = await api.get('/incidents', { params });
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
};

export default incidentsService;
