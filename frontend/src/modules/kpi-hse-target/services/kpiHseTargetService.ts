import api from '@/core/lib/api';
import {
  HseTarget,
  CreateHseTargetDTO,
  UpdateHseTargetDTO,
  HseTargetType,
  Month,
} from '../types/kpi-hse-target.types';

export interface HseTargetsResponse {
  data: HseTarget[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

interface FetchHseTargetsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  type?: HseTargetType;
  code?: string;
  month?: Month;
  year?: number;
}

const kpiHseTargetService = {
  async getHseTargets(params: FetchHseTargetsParams = {}): Promise<HseTargetsResponse> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.type) queryParams.append('type', params.type);
    if (params.code) queryParams.append('code', params.code);
    if (params.month) queryParams.append('month', params.month);
    if (params.year) queryParams.append('year', params.year.toString());

    const response = await api.get<HseTargetsResponse>(`/kpi-hse-targets?${queryParams.toString()}`);
    return response.data;
  },

  async getHseTarget(id: string): Promise<HseTarget> {
    const response = await api.get<HseTarget>(`/kpi-hse-targets/${id}`);
    return response.data;
  },

  async createHseTarget(data: CreateHseTargetDTO): Promise<HseTarget> {
    const response = await api.post<HseTarget>('/kpi-hse-targets', data);
    return response.data;
  },

  async updateHseTarget(id: string, data: UpdateHseTargetDTO): Promise<HseTarget> {
    const response = await api.patch<HseTarget>(`/kpi-hse-targets/${id}`, data);
    return response.data;
  },

  async deleteHseTarget(id: string): Promise<void> {
    await api.delete(`/kpi-hse-targets/${id}`);
  },
};

export default kpiHseTargetService;
