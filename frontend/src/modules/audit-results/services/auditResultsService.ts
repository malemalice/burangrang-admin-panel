import { AuditResult, CompliantStatusEnum } from '../types/audit-result.types';
import { PaginatedResponse, PaginationParams } from '@/core/lib/types';
import api from '@/core/lib/api';
import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';

const auditResultsService = {
  getAll: async (params: PaginationParams & {
    auditId?: string;
    auditElementId?: string;
    auditClauseId?: string;
    auditCriteriaId?: string;
    compliantStatus?: CompliantStatusEnum;
    status?: GeneralStatusEnum;
    search?: string;
  }): Promise<PaginatedResponse<AuditResult>> => {
    const response = await api.get('/audit-schedules/results', { params });
    return response.data;
  },
};

export default auditResultsService;
