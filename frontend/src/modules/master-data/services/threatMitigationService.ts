import api from '@/lib/api';
import { ThreatMitigation } from '@/lib/types';

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
  threatId?: string;
  level?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

const threatMitigationService = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<ThreatMitigation>> => {
    const response = await api.get('/threat-mitigations', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ThreatMitigation> => {
    const response = await api.get(`/threat-mitigations/${id}`);
    return response.data;
  },

  create: async (data: Partial<ThreatMitigation>): Promise<ThreatMitigation> => {
    const response = await api.post('/threat-mitigations', data);
    return response.data;
  },

  update: async (id: string, data: Partial<ThreatMitigation>): Promise<ThreatMitigation> => {
    const response = await api.patch(`/threat-mitigations/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/threat-mitigations/${id}`);
  },
  
  getByThreat: async (threatId: string): Promise<ThreatMitigation[]> => {
    const response = await api.get('/threat-mitigations', { 
      params: { 
        threatId,
        limit: 100 // Get all mitigations for a threat
      } 
    });
    return response.data.data;
  }
};

export default threatMitigationService; 