import api from '@/lib/api';
import { SubmitApprovalDto } from '@/lib/types';

const approvalService = {
  async checkApprovalRights(dataId: string) {
    const response = await api.get(`/master-approvals/check-approval/${dataId}`);
    return response.data;
  },

  async submitApproval(data: SubmitApprovalDto) {
    const response = await api.post('/master-approvals/approval', data);
    return response.data;
  },
};

export default approvalService; 