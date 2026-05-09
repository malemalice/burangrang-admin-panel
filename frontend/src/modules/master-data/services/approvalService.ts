import api from '@/core/lib/api';
import { SubmitApprovalDto } from '@/core/lib/types';
import type { ApprovalStatusHistory } from '../types/master-data.types';

const approvalService = {
  async checkApprovalRights(dataId: string, entity?: string) {
    const params = entity ? { entity } : {};
    const response = await api.get(`/master-approvals/check-approval/${dataId}`, { params });
    return response.data as { canApprove: boolean };
  },

  async submitApproval(data: SubmitApprovalDto) {
    const response = await api.post('/master-approvals/approval', data);
    return response.data;
  },

  async checkApprovalStatus(dataId: string, entity?: string): Promise<ApprovalStatusHistory> {
    const params = entity ? { entity } : {};
    const response = await api.get(`/master-approvals/check-approval-status/${dataId}`, { params });
    return response.data;
  },
};

export default approvalService;
