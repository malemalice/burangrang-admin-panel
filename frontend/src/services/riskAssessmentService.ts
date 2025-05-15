import api from '@/lib/api';
import { RiskAssessment, PaginatedResponse } from '@/lib/types';

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  departmentId?: string;
  status?: string;
  search?: string;
}

export interface CreateRiskAssessmentItemDTO {
  mThreatId: string;
  mHseCategoryId: string;
  likelihoodLevel: number;
  consequenceLevel: number;
  riskMatrixRating: string;
}

export interface CreateRiskAssessmentDTO {
  code: string;
  departmentId: string;
  assessmentDate?: Date;
  createdBy: string;
  status: string;
  isActive?: boolean;
  items: CreateRiskAssessmentItemDTO[];
}

export interface UpdateRiskAssessmentDTO extends Partial<CreateRiskAssessmentDTO> {}

const riskAssessmentService = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<RiskAssessment>> => {
    const response = await api.get('/assessment', { params });
    return response.data;
  },

  getById: async (id: string): Promise<RiskAssessment> => {
    const response = await api.get(`/assessment/${id}`);
    return response.data;
  },

  create: async (data: CreateRiskAssessmentDTO): Promise<RiskAssessment> => {
    const response = await api.post('/assessment', data);
    return response.data;
  },

  update: async (id: string, data: UpdateRiskAssessmentDTO): Promise<RiskAssessment> => {
    const response = await api.patch(`/assessment/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/assessment/${id}`);
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