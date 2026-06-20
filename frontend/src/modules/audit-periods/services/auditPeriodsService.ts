import api from '@/core/lib/api';
import { PaginatedResponse } from '@/core/lib/types';
import { AuditPeriod, CreateAuditPeriodDTO } from '../types/audit-period.types';

const auditPeriodsService = {
  getAll: async (params: {
    page?: number;
    limit?: number;
    year?: number;
    sortOrder?: 'asc' | 'desc';
    options?: boolean;
  } = {}): Promise<PaginatedResponse<AuditPeriod>> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.year) queryParams.append('year', params.year.toString());
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.options) queryParams.append('options', 'true');
    const response = await api.get(`/audit-periods?${queryParams.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<AuditPeriod> => {
    const response = await api.get(`/audit-periods/${id}`);
    return response.data;
  },

  getLatest: async (): Promise<AuditPeriod | null> => {
    const response = await api.get('/audit-periods/latest');
    return response.data;
  },

  getElementCount: async (): Promise<{ count: number }> => {
    const response = await api.get('/audit-periods/element-count?options=true');
    return response.data;
  },

  create: async (data: CreateAuditPeriodDTO): Promise<AuditPeriod> => {
    const response = await api.post('/audit-periods', data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/audit-periods/${id}`);
  },
};

export default auditPeriodsService;
