import api from '@/core/lib/api';
import { PaginatedResponse } from '@/core/lib/types';
import {
  HfacsNodeDTO,
  CreateHfacsNodeDTO,
  UpdateHfacsNodeDTO,
  HfacsNodeSearchParams,
} from '../types/master-data.types';

const hfacsNodeService = {
  async getAll(
    params: HfacsNodeSearchParams = {},
  ): Promise<PaginatedResponse<HfacsNodeDTO>> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);
    if (params.search) query.append('search', params.search);
    if (params.section) query.append('section', params.section);
    if (params.depth !== undefined) query.append('depth', params.depth.toString());
    if (params.parentId !== undefined) {
      query.append('parentId', params.parentId === null ? 'null' : params.parentId);
    }
    if (params.isActive !== undefined) query.append('isActive', params.isActive.toString());
    if (params.options) query.append('options', 'true');

    const response = await api.get(`/hfacs-nodes?${query.toString()}`);
    return response.data;
  },

  async getTree(opts: { includeInactive?: boolean } = {}): Promise<HfacsNodeDTO[]> {
    const params = new URLSearchParams({ options: 'true' });
    if (opts.includeInactive) params.append('includeInactive', 'true');
    const response = await api.get(`/hfacs-nodes/tree?${params.toString()}`);
    return response.data;
  },

  async getById(id: string): Promise<HfacsNodeDTO> {
    const response = await api.get(`/hfacs-nodes/${id}`);
    return response.data;
  },

  async create(dto: CreateHfacsNodeDTO): Promise<HfacsNodeDTO> {
    const response = await api.post('/hfacs-nodes', dto);
    return response.data;
  },

  async update(id: string, dto: UpdateHfacsNodeDTO): Promise<HfacsNodeDTO> {
    const response = await api.patch(`/hfacs-nodes/${id}`, dto);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/hfacs-nodes/${id}`);
  },
};

export default hfacsNodeService;
