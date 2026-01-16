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
};

export default inspectionItemsService;
