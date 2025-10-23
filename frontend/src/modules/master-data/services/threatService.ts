import api from '@/lib/api';
import { Threat } from '@/lib/types';

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
  hseCategoryId?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

const threatService = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Threat>> => {
    const response = await api.get('/threats', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Threat> => {
    const response = await api.get(`/threats/${id}`);
    return response.data;
  },

  create: async (data: Partial<Threat>): Promise<Threat> => {
    const response = await api.post('/threats', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Threat>): Promise<Threat> => {
    const response = await api.patch(`/threats/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/threats/${id}`);
  },

  // Get threats by HSE category ID
  getByHseCategory: async (hseCategoryId: string, params?: Omit<PaginationParams, 'hseCategoryId'>): Promise<PaginatedResponse<Threat>> => {
    const queryParams = { ...params, hseCategoryId };
    const response = await api.get('/threats', { params: queryParams });
    return response.data;
  }
};

export default threatService; 