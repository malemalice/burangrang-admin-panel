import { InspectionItem, UpdateInspectionItemDTO, InspectionItemSearchParams } from '../types/inspection-item.types';
import { PaginatedResponse, PaginationParams } from '@/core/lib/types';
import api from '@/core/lib/api';

const inspectionItemsService = {
  getAll: async (params: InspectionItemSearchParams): Promise<PaginatedResponse<InspectionItem>> => {
    const response = await api.get('/inspection-items', { params });
    return response.data;
  },

  getById: async (id: string): Promise<InspectionItem> => {
    const response = await api.get(`/inspection-items/${id}`);
    return response.data;
  },

  update: async (id: string, data: UpdateInspectionItemDTO): Promise<InspectionItem> => {
    const response = await api.patch(`/inspection-items/${id}`, data);
    return response.data;
  },

  checkApprovalRights: async (id: string) => {
    const response = await api.get(`/master-approvals/check-approval/${id}`, {
      params: { entity: 'INSPECTION_ITEM' },
    });
    return response.data;
  },

  checkApprovalStatus: async (id: string) => {
    const response = await api.get(`/master-approvals/check-approval-status/${id}`, {
      params: { entity: 'INSPECTION_ITEM' },
    });
    return response.data;
  },

  submitApproval: async (id: string, status: 'APPROVED' | 'REJECTED', notes: string) => {
    const response = await api.post('/master-approvals/approval', {
      dataId: id,
      entity: 'INSPECTION_ITEM',
      status,
      notes,
    });
    return response.data;
  },
};

export default inspectionItemsService;
