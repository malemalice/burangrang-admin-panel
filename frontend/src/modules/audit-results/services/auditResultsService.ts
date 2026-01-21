import { AuditResult } from '../types/audit-result.types';
import { PaginatedResponse, PaginationParams } from '@/core/lib/types';
import api from '@/core/lib/api';

const auditResultsService = {
  getAll: async (params: PaginationParams & {
    auditId?: string;
    auditElementId?: string;
    auditClauseId?: string;
    auditCriteriaId?: string;
    compliantStatus?: string;
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<AuditResult>> => {
    const response = await api.get('/audit-schedules/results', { params });
    return response.data;
  },
};

export default auditResultsService;
