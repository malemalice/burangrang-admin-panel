import api from '@/lib/api';
import { JobPosition } from '@/lib/types';

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

const jobPositionService = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<JobPosition>> => {
    const response = await api.get('/job-positions', { params });
    return response.data;
  },

  getById: async (id: string): Promise<JobPosition> => {
    const response = await api.get(`/job-positions/${id}`);
    return response.data;
  },

  create: async (data: Partial<JobPosition>): Promise<JobPosition> => {
    const response = await api.post('/job-positions', data);
    return response.data;
  },

  update: async (id: string, data: Partial<JobPosition>): Promise<JobPosition> => {
    const response = await api.patch(`/job-positions/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/job-positions/${id}`);
  },
};

export default jobPositionService; 