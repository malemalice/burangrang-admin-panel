import api from '@/core/lib/api';
import { RiskMitigation } from '@/core/lib/types';

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
  riskId?: string;
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

const riskMitigationService = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<RiskMitigation>> => {
    const response = await api.get('/risk-mitigations', { params });
    return response.data;
  },

  getById: async (id: string): Promise<RiskMitigation> => {
    const response = await api.get(`/risk-mitigations/${id}`);
    return response.data;
  },

  create: async (data: Partial<RiskMitigation>): Promise<RiskMitigation> => {
    const response = await api.post('/risk-mitigations', data);
    return response.data;
  },

  update: async (id: string, data: Partial<RiskMitigation>): Promise<RiskMitigation> => {
    const response = await api.patch(`/risk-mitigations/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/risk-mitigations/${id}`);
  },
  
  getByRisk: async (riskId: string): Promise<RiskMitigation[]> => {
    const response = await api.get('/risk-mitigations', { 
      params: { 
        riskId,
        limit: 100 // Get all mitigations for a risk
      } 
    });
    return response.data.data;
  }
};

export default riskMitigationService;
