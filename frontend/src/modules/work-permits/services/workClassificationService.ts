import api from '@/core/lib/api';
import {
  WorkClassification,
  WorkClassificationDTO,
  CreateWorkClassificationDTO,
  UpdateWorkClassificationDTO,
  PaginatedResponse,
  PaginationParams,
  mapWorkClassificationDtoToModel,
} from '../types/work-classification.types';

const mapDto = mapWorkClassificationDtoToModel;

const workClassificationService = {
  getWorkClassifications: async (
    params: PaginationParams & { isActive?: boolean },
  ): Promise<PaginatedResponse<WorkClassification>> => {
    try {
      const queryParams = new URLSearchParams({
        page: params.page.toString(),
        limit: params.limit.toString(),
      });

      if (params.sortBy) {
        queryParams.append('sortBy', params.sortBy);
        queryParams.append('sortOrder', params.sortOrder || 'asc');
      }

      if (params.search) {
        queryParams.append('search', params.search);
      }

      if (params.isActive !== undefined) {
        queryParams.append('isActive', params.isActive.toString());
      }

      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '' && key !== 'isActive') {
            queryParams.append(key, String(value));
          }
        });
      }

      const response = await api.get(`/work-classifications?${queryParams.toString()}`);
      const meta = response.data.meta;
      const total = meta?.total ?? 0;
      const limit = meta?.limit ?? params.limit;
      const page = meta?.page ?? params.page;
      const pageCount =
        meta?.pageCount ?? (limit > 0 ? Math.ceil(total / limit) : 0);

      return {
        data: (response.data.data as WorkClassificationDTO[]).map(mapDto),
        meta: {
          total,
          page,
          limit,
          pageCount,
        },
      };
    } catch (error: unknown) {
      console.error('Error fetching work classifications:', error);
      const errorMessage =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      throw new Error(errorMessage || 'Failed to fetch work classifications');
    }
  },

  getWorkClassificationById: async (id: string): Promise<WorkClassification> => {
    try {
      const response = await api.get(`/work-classifications/${id}`);
      return mapDto(response.data as WorkClassificationDTO);
    } catch (error: unknown) {
      console.error(`Error fetching work classification ${id}:`, error);
      const errorMessage =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      throw new Error(errorMessage || `Failed to fetch work classification ${id}`);
    }
  },

  createWorkClassification: async (
    data: CreateWorkClassificationDTO,
  ): Promise<WorkClassification> => {
    try {
      const response = await api.post('/work-classifications', data);
      return mapDto(response.data as WorkClassificationDTO);
    } catch (error: unknown) {
      console.error('Error creating work classification:', error);
      const errorMessage =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      throw new Error(errorMessage || 'Failed to create work classification');
    }
  },

  updateWorkClassification: async (
    id: string,
    data: UpdateWorkClassificationDTO,
  ): Promise<WorkClassification> => {
    try {
      const response = await api.patch(`/work-classifications/${id}`, data);
      return mapDto(response.data as WorkClassificationDTO);
    } catch (error: unknown) {
      console.error(`Error updating work classification ${id}:`, error);
      const errorMessage =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      throw new Error(errorMessage || `Failed to update work classification ${id}`);
    }
  },

  deleteWorkClassification: async (id: string): Promise<void> => {
    try {
      await api.delete(`/work-classifications/${id}`);
    } catch (error: unknown) {
      console.error(`Error deleting work classification ${id}:`, error);
      const errorMessage =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      throw new Error(errorMessage || `Failed to delete work classification ${id}`);
    }
  },
};

export default workClassificationService;
