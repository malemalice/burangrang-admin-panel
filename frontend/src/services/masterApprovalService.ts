import api from '@/lib/api';
import { MasterApproval, PaginatedResponse } from '@/lib/types';

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
}

export interface CreateMasterApprovalItemDTO {
  role_id: string;
  department_id: string;
  createdBy: string;
  order?: number;
}

export interface CreateMasterApprovalDTO {
  entity: string;
  isActive?: boolean;
  items: CreateMasterApprovalItemDTO[];
}

export interface UpdateMasterApprovalDTO extends Partial<CreateMasterApprovalDTO> {}

const masterApprovalService = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<MasterApproval>> => {
    const response = await api.get('/master-approvals', { params });
    return response.data;
  },

  getById: async (id: string): Promise<MasterApproval> => {
    const response = await api.get(`/master-approvals/${id}`);
    return response.data;
  },

  create: async (data: CreateMasterApprovalDTO): Promise<MasterApproval> => {
    const response = await api.post('/master-approvals', data);
    return response.data;
  },

  update: async (id: string, data: UpdateMasterApprovalDTO): Promise<MasterApproval> => {
    const response = await api.patch(`/master-approvals/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/master-approvals/${id}`);
  },
};

export default masterApprovalService; 