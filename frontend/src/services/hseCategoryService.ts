import api from '@/lib/api';
import { HseCategory } from '@/lib/types';

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

const hseCategoryService = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<HseCategory>> => {
    const response = await api.get('/hse-categories', { params });
    return response.data;
  },

  getById: async (id: string): Promise<HseCategory> => {
    const response = await api.get(`/hse-categories/${id}`);
    return response.data;
  },

  create: async (data: Partial<HseCategory>): Promise<HseCategory> => {
    const response = await api.post('/hse-categories', data);
    return response.data;
  },

  update: async (id: string, data: Partial<HseCategory>): Promise<HseCategory> => {
    const response = await api.patch(`/hse-categories/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/hse-categories/${id}`);
  },
};

export default hseCategoryService; 