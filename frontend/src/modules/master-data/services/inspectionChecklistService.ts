import api from '@/core/lib/api';
import { PaginatedResponse } from '@/core/lib/types';
import {
  InspectionChecklistDTO,
  CreateInspectionChecklistDTO,
  UpdateInspectionChecklistDTO,
  InspectionChecklistSearchParams,
} from '../types/master-data.types';

const inspectionChecklistService = {
  async getAll(params: InspectionChecklistSearchParams = {}): Promise<PaginatedResponse<InspectionChecklistDTO>> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);
    if (params.search) query.append('search', params.search);
    if (params.isActive !== undefined) query.append('isActive', params.isActive.toString());
    if (params.rootsOnly) query.append('rootsOnly', 'true');
    if (params.options) query.append('options', 'true');

    const response = await api.get(`/inspection-checklists?${query.toString()}`);
    return response.data;
  },

  async getTree(includeInactive = false): Promise<InspectionChecklistDTO[]> {
    const query = new URLSearchParams({ options: 'true' });
    if (includeInactive) query.append('includeInactive', 'true');
    const response = await api.get(`/inspection-checklists/tree?${query.toString()}`);
    return response.data;
  },

  async getById(id: string): Promise<InspectionChecklistDTO> {
    const response = await api.get(`/inspection-checklists/${id}`);
    return response.data;
  },

  async create(dto: CreateInspectionChecklistDTO): Promise<InspectionChecklistDTO> {
    const response = await api.post('/inspection-checklists', dto);
    return response.data;
  },

  async update(id: string, dto: UpdateInspectionChecklistDTO): Promise<InspectionChecklistDTO> {
    const response = await api.patch(`/inspection-checklists/${id}`, dto);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/inspection-checklists/${id}`);
  },
};

export default inspectionChecklistService;
