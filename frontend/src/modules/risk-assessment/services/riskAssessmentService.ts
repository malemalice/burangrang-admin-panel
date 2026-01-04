import { RiskAssessment, PaginatedResponse, PaginationParams } from '@/core/lib/types';
import api from '@/core/lib/api';

export interface CreateRiskAssessmentItemDTO {
  mRiskId: string;
  mRiskCategoryId: string;
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
  createdBy?: string; // Optional - backend sets this from authenticated user
  status: string;
  isActive?: boolean;
  items?: CreateRiskAssessmentItemDTO[];
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

  calculateRiskRating: async (likelihoodLevel: string, consequenceLevel: number): Promise<any> => {
    const response = await api.post('/risk-matrix/calculate', {
      likelihoodLevel,
      consequenceLevel
    });
    return response.data;
  },

  // Get all risk matrix entries
  getRiskMatrixEntries: async (): Promise<any> => {
    const response = await api.get('/risk-matrix/risk-matrices', {
      params: {
        page: 1,
        limit: 100
      }
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
  },

  // Risk Assessment Items endpoints
  getItems: async (assessmentId: string, params: PaginationParams): Promise<PaginatedResponse<any>> => {
    const response = await api.get(`/risk-assessment/${assessmentId}/items`, { params });
    return response.data;
  },

  getItemById: async (assessmentId: string, itemId: string): Promise<any> => {
    const response = await api.get(`/risk-assessment/${assessmentId}/items/${itemId}`);
    return response.data;
  },

  createItem: async (assessmentId: string, data: CreateRiskAssessmentItemDTO): Promise<any> => {
    const response = await api.post(`/risk-assessment/${assessmentId}/items`, data);
    return response.data;
  },

  updateItem: async (assessmentId: string, itemId: string, data: Partial<CreateRiskAssessmentItemDTO>): Promise<any> => {
    const response = await api.patch(`/risk-assessment/${assessmentId}/items/${itemId}`, data);
    return response.data;
  },

  deleteItem: async (assessmentId: string, itemId: string): Promise<void> => {
    await api.delete(`/risk-assessment/${assessmentId}/items/${itemId}`);
  }
};

export default riskAssessmentService;

