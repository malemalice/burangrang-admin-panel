import { RiskAssessment, PaginatedResponse, PaginationParams } from '@/core/lib/types';
import api from '@/core/lib/api';

export interface CreateRiskAssessmentItemDTO {
  mThreatId: string;
  mHseCategoryId: string;
  riskDescription: string;
  likelihoodLevel: number;
  consequenceLevel: number;
  riskMatrixRating: string;
  interpretation: string;
  postLikelihoodLevel: number;
  postConsequenceLevel: number;
  postRiskMatrixRating: string;
  postInterpretation: string;
}

export interface CreateRiskAssessmentDTO {
  code: string;
  description?: string;
  departmentId: string;
  assessmentDate?: Date;
  createdBy: string;
  status: string;
  isActive?: boolean;
  items: CreateRiskAssessmentItemDTO[];
  assigneeId?: string;
  actionPlan?: string;
}

export interface CreateRiskControlDTO {
  eliminate?: string;
  transfer?: string;
  reduce?: string;
  isOpen?: boolean;
  isAccept?: boolean;
  isActive?: boolean;
  entity: string;
  entityId: string;
}

export interface UpdateRiskControlDTO extends Partial<CreateRiskControlDTO> {}

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
  },

  // Risk Control endpoints
  createRiskControl: async (data: CreateRiskControlDTO): Promise<any> => {
    const response = await api.post('/risk-control', data);
    return response.data;
  },

  getRiskControl: async (id: string): Promise<any> => {
    const response = await api.get(`/risk-control/${id}`);
    return response.data;
  },

  updateRiskControl: async (id: string, data: UpdateRiskControlDTO): Promise<any> => {
    const response = await api.patch(`/risk-control/${id}`, data);
    return response.data;
  },

  deleteRiskControl: async (id: string): Promise<void> => {
    await api.delete(`/risk-control/${id}`);
  }
};

export default riskAssessmentService;

