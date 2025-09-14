import api from '@/core/lib/api';
import { 
  MasterApproval, 
  PaginatedResponse, 
  PaginationParams,
  MasterApprovalDTO,
  CreateMasterApprovalDTO,
  UpdateMasterApprovalDTO 
} from '../types/master-data.types';

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