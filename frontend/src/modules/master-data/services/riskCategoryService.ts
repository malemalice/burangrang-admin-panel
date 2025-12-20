import api from '@/core/lib/api';
import { RiskCategory } from '@/core/lib/types';

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

const riskCategoryService = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<RiskCategory>> => {
    const response = await api.get('/risk-categories', { params });
    return response.data;
  },

  getById: async (id: string): Promise<RiskCategory> => {
    const response = await api.get(`/risk-categories/${id}`);
    return response.data;
  },

  create: async (data: Partial<RiskCategory>): Promise<RiskCategory> => {
    const response = await api.post('/risk-categories', data);
    return response.data;
  },

  update: async (id: string, data: Partial<RiskCategory>): Promise<RiskCategory> => {
    const response = await api.patch(`/risk-categories/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/risk-categories/${id}`);
  },
};

export default riskCategoryService;
