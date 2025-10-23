import { RiskAssessment, PaginatedResponse, PaginationParams } from '@/lib/types';
import api from '@/lib/api';

export interface CreateRiskAssessmentDTO {
  code: string;
  departmentId: string;
  assessmentDate?: Date;
  createdBy: string;
  status: string;
  isActive?: boolean;
  items: {
    mThreatId: string;
    mHseCategoryId: string;
    likelihoodLevel: number;
    consequenceLevel: number;
    riskMatrixRating: string;
  }[];
  assigneeId?: string;
  actionPlan?: string;
}

export type UpdateRiskAssessmentDTO = Partial<CreateRiskAssessmentDTO>;

const riskAssessmentService = {
  getAll: async (params: PaginationParams): Promise<PaginatedResponse<RiskAssessment>> => {
    const response = await api.get('/risk-assessment', { params });
    return response.data;
  },

  getById: async (id: string): Promise<RiskAssessment> => {
    const response = await api.get(`/risk-assessment/${id}`);
    return response.data;
  },

  create: async (data: CreateRiskAssessmentDTO): Promise<RiskAssessment> => {
    const response = await api.post('/risk-assessment', data);
    return response.data;
  },

  update: async (id: string, data: UpdateRiskAssessmentDTO): Promise<RiskAssessment> => {
    const response = await api.patch(`/risk-assessment/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/risk-assessment/${id}`);
  },

  calculateRiskRating: async (likelihoodLevel: number, consequenceLevel: number): Promise<any> => {
    const response = await api.post('/risk-matrix/calculate', {
      likelihoodLevel,
      consequenceLevel
    });
    return response.data;
  }
};

export default riskAssessmentService; 