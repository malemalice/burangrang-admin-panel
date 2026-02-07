import api from '@/core/lib/api';
import { PaginatedResponse } from '@/core/lib/types';
import {
  RiskMatrixDTO,
  RiskMatrix,
  CreateRiskMatrixDTO,
  UpdateRiskMatrixDTO,
  RiskMatrixSearchParams,
  RiskRating,
  CalculateRiskDTO,
} from '../types/risk-matrix.types';

// Transform DTO to frontend model
const mapRiskMatrixDtoToRiskMatrix = (riskMatrixDto: RiskMatrixDTO): RiskMatrix => ({
  id: riskMatrixDto.id,
  likelihoodLevel: riskMatrixDto.likelihoodLevel,
  likelihoodName: riskMatrixDto.likelihoodName,
  likelihoodDesc: riskMatrixDto.likelihoodDesc,
  consequenceLevel: riskMatrixDto.consequenceLevel,
  consequenceName: riskMatrixDto.consequenceName,
  consequenceDesc: riskMatrixDto.consequenceDesc,
  interpretation: riskMatrixDto.interpretation,
  isActive: riskMatrixDto.isActive,
  createdAt: riskMatrixDto.createdAt,
  updatedAt: riskMatrixDto.updatedAt,
});

const riskMatrixService = {
  // GET all risk matrices with pagination
  getRiskMatrices: async (params: RiskMatrixSearchParams): Promise<PaginatedResponse<RiskMatrix>> => {
    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
    });

    if (params.search) queryParams.append('search', params.search);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    try {
      const response = await api.get<{ data: RiskMatrixDTO[]; meta: any }>(
        `/risk-matrix/risk-matrices?${queryParams.toString()}`,
      );
      return {
        data: response.data.data.map(mapRiskMatrixDtoToRiskMatrix),
        meta: response.data.meta,
      };
    } catch (error: any) {
      console.error('Error fetching risk matrices:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch risk matrices';
      throw new Error(errorMessage);
    }
  },

  // GET single risk matrix by ID
  getRiskMatrixById: async (id: string): Promise<RiskMatrix> => {
    try {
      const response = await api.get<RiskMatrixDTO>(`/risk-matrix/risk-matrices/${id}`);
      return mapRiskMatrixDtoToRiskMatrix(response.data);
    } catch (error: any) {
      console.error('Error fetching risk matrix:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch risk matrix';
      throw new Error(errorMessage);
    }
  },

  // CREATE risk matrix entry
  createRiskMatrix: async (riskMatrixData: CreateRiskMatrixDTO): Promise<RiskMatrix> => {
    try {
      const response = await api.post<RiskMatrixDTO>('/risk-matrix/risk-matrices', riskMatrixData);
      return mapRiskMatrixDtoToRiskMatrix(response.data);
    } catch (error: any) {
      console.error('Error creating risk matrix:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create risk matrix';
      throw new Error(errorMessage);
    }
  },

  // UPDATE risk matrix entry
  updateRiskMatrix: async (id: string, riskMatrixData: UpdateRiskMatrixDTO): Promise<RiskMatrix> => {
    try {
      const response = await api.patch<RiskMatrixDTO>(`/risk-matrix/risk-matrices/${id}`, riskMatrixData);
      return mapRiskMatrixDtoToRiskMatrix(response.data);
    } catch (error: any) {
      console.error('Error updating risk matrix:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update risk matrix';
      throw new Error(errorMessage);
    }
  },

  // DELETE risk matrix entry
  deleteRiskMatrix: async (id: string): Promise<void> => {
    try {
      await api.delete(`/risk-matrix/risk-matrices/${id}`);
    } catch (error: any) {
      console.error('Error deleting risk matrix:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete risk matrix';
      throw new Error(errorMessage);
    }
  },

  // Calculate risk rating based on likelihood and consequence levels
  calculateRiskRating: async (data: CalculateRiskDTO): Promise<RiskRating> => {
    try {
      const response = await api.post<RiskRating>('/risk-matrix/calculate', data);
      return response.data;
    } catch (error: any) {
      console.error('Error calculating risk rating:', error);
      const errorMessage = error.response?.data?.message || 'Failed to calculate risk rating';
      throw new Error(errorMessage);
    }
  },
};

export default riskMatrixService;
