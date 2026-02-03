import api from '@/core/lib/api';
import { Risk } from '@/core/lib/types';

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
  riskCategoryId?: string;
  name?: string;
  code?: string;
  options?: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

const riskService = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Risk>> => {
    const response = await api.get('/risks', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Risk> => {
    const response = await api.get(`/risks/${id}`);
    return response.data;
  },

  create: async (data: Partial<Risk>): Promise<Risk> => {
    const response = await api.post('/risks', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Risk>): Promise<Risk> => {
    const response = await api.patch(`/risks/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/risks/${id}`);
  },

  // Get risks by risk category ID
  getByRiskCategory: async (riskCategoryId: string, params?: Omit<PaginationParams, 'riskCategoryId'>): Promise<PaginatedResponse<Risk>> => {
    const queryParams = { ...params, riskCategoryId };
    const response = await api.get('/risks', { params: queryParams });
    return response.data;
  }
};

export default riskService;
