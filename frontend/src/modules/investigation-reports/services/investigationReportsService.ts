import api from '@/core/lib/api';
import type { PaginatedResponse, PaginationParams } from '@/core/lib/types';
import type {
  CreateInvestigationReportDTO,
  InvestigationReport,
  UpdateInvestigationReportDTO,
} from '../types/investigation-report.types';

export interface FindInvestigationReportsParams extends PaginationParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  status?: string | string[];
  incidentId?: string;
  areaId?: string | string[];
  incidentDateFrom?: string;
  incidentDateTo?: string;
  search?: string;
}

const investigationReportsService = {
  getAll: async (
    params: FindInvestigationReportsParams,
  ): Promise<PaginatedResponse<InvestigationReport>> => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        value.forEach((v) => sp.append(key, String(v)));
      } else {
        sp.append(key, String(value));
      }
    });
    const response = await api.get(`/investigation-reports?${sp.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<InvestigationReport> => {
    const response = await api.get(`/investigation-reports/${id}`);
    return response.data;
  },

  getByIncidentId: async (incidentId: string): Promise<InvestigationReport | null> => {
    const response = await api.get(`/investigation-reports/by-incident/${incidentId}`);
    return response.data;
  },

  create: async (data: CreateInvestigationReportDTO): Promise<InvestigationReport> => {
    const response = await api.post('/investigation-reports', data);
    return response.data;
  },

  update: async (id: string, data: UpdateInvestigationReportDTO): Promise<InvestigationReport> => {
    const response = await api.patch(`/investigation-reports/${id}`, data);
    return response.data;
  },

  complete: async (id: string): Promise<InvestigationReport> => {
    const response = await api.post(`/investigation-reports/${id}/complete`);
    return response.data;
  },

  reopen: async (id: string): Promise<InvestigationReport> => {
    const response = await api.post(`/investigation-reports/${id}/reopen`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/investigation-reports/${id}`);
  },

  getHfacsCatalogue: async (): Promise<{
    latentFailure: any[];
    activeFailure: any[];
  }> => {
    const response = await api.get('/investigation-reports/catalogue/hfacs');
    return response.data;
  },
};

export default investigationReportsService;
