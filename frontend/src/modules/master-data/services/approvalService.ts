import api from '@/core/lib/api';
import { SubmitApprovalDto } from '@/core/lib/types';

export interface ApprovalHistory {
  id: string;
  status: string;
  notes: string;
  createdAt: string;
  line: number;
  department: { id: string; name: string };
  jobPosition: { id: string; name: string };
  creator: { id: string; name: string };
}

export interface ApprovalLine {
  line: number;
  department: { id: string; name: string };
  jobPosition: { id: string; name: string };
  status: 'completed' | 'current' | 'pending';
}

export interface ApprovalStatusHistory {
  history: ApprovalHistory[];
  nextApprover: {
    line: number;
    department: { id: string; name: string };
    jobPosition: { id: string; name: string };
  } | null;
  allApprovalLines: ApprovalLine[];
  currentStatus: string;
}

const approvalService = {
  async checkApprovalRights(dataId: string) {
    const response = await api.get(`/master-approvals/check-approval/${dataId}`);
    return response.data;
  },

  async submitApproval(data: SubmitApprovalDto) {
    const response = await api.post('/master-approvals/approval', data);
    return response.data;
  },

  async checkApprovalStatus(dataId: string): Promise<ApprovalStatusHistory> {
    const response = await api.get(`/master-approvals/check-approval-status/${dataId}`);
    return response.data;
  },
};

export default approvalService; 