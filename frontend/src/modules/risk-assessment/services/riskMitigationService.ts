import api from '@/core/lib/api';
import { PaginationParams, PaginatedResponse } from '@/core/lib/types';

export interface RiskMitigation {
  id: string;
  eliminate?: string;
  transfer?: string;
  reduce?: string;
  accept?: string;
  isActive: boolean;
  riskId: string;
  createdAt: Date;
  updatedAt: Date;
}

const riskMitigationService = {
  getAll: async (params?: PaginationParams & { riskId?: string }): Promise<PaginatedResponse<RiskMitigation>> => {
    const response = await api.get('/risk-mitigations', { params });
    return response.data;
  },

  getById: async (id: string): Promise<RiskMitigation> => {
    const response = await api.get(`/risk-mitigations/${id}`);
    return response.data;
  },

  getByRiskId: async (riskId: string): Promise<RiskMitigation[]> => {
    const response = await api.get('/risk-mitigations', {
      params: {
        riskId,
        page: 1,
        limit: 100,
        isActive: true,
      },
    });
    return response.data.data;
  },
};

export default riskMitigationService;
