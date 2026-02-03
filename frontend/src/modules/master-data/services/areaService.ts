import api from '@/core/lib/api';
import { 
  AreaDTO, 
  CreateAreaDTO, 
  UpdateAreaDTO,
  PaginatedResponse,
  PaginationParams
} from '../types/master-data.types';

const areaService = {
  // Get all areas with pagination and filtering
  async getAreas(params: PaginationParams): Promise<PaginatedResponse<AreaDTO>> {
    try {
      const queryParams = new URLSearchParams({
        page: params.page.toString(),
        limit: params.limit.toString()
      });

      // Add sorting if provided
      if (params.sortBy) {
        queryParams.append('sortBy', params.sortBy);
        queryParams.append('sortOrder', params.sortOrder || 'asc');
      }

      // Add search if provided
      if (params.search) {
        queryParams.append('search', params.search);
      }

      // Add any additional filters
      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }

      if (params.options) {
        queryParams.append('options', 'true');
      }

      const response = await api.get(`/areas?${queryParams.toString()}`);
      return {
        data: response.data.data,
        meta: response.data.meta
      };
    } catch (error) {
      console.error('Error fetching areas:', error);
      throw error;
    }
  },

  // Get a single area by ID
  async getArea(id: string): Promise<AreaDTO> {
    const response = await api.get<AreaDTO>(`/areas/${id}`);
    return response.data;
  },

  // Create a new area
  async createArea(data: CreateAreaDTO): Promise<AreaDTO> {
    const response = await api.post<AreaDTO>('/areas', data);
    return response.data;
  },

  // Update an area
  async updateArea(id: string, data: UpdateAreaDTO): Promise<AreaDTO> {
    const response = await api.patch<AreaDTO>(`/areas/${id}`, data);
    return response.data;
  },

  // Delete an area
  async deleteArea(id: string): Promise<void> {
    await api.delete(`/areas/${id}`);
  }
};

export default areaService;
