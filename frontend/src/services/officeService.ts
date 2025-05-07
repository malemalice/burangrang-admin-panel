import api from '@/lib/api';
import { Office, PaginatedResponse, PaginationParams } from '@/lib/types';
import { User } from '@/lib/types';

// Interface for office data from API that matches backend structure
export interface OfficeDTO {
  id: string;
  name: string;
  code: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  parentId?: string;
  children?: OfficeDTO[];
  parent?: OfficeDTO;
  users?: User[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface for creating an office
export interface CreateOfficeDTO {
  name: string;
  code: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  parentId?: string;
  isActive?: boolean;
}

// Interface for updating an office
export interface UpdateOfficeDTO {
  name?: string;
  code?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  parentId?: string;
  isActive?: boolean;
}

// Convert OfficeDTO from backend to Office model for frontend
const mapOfficeDtoToOffice = (officeDto: OfficeDTO): Office => {
  return {
    id: officeDto.id,
    name: officeDto.name,
    code: officeDto.code,
    description: officeDto.description,
    address: officeDto.address,
    phone: officeDto.phone,
    email: officeDto.email,
    parentId: officeDto.parentId,
    parent: officeDto.parent,
    children: officeDto.children?.map(mapOfficeDtoToOffice),
    isActive: officeDto.isActive,
    createdAt: officeDto.createdAt,
    updatedAt: officeDto.updatedAt
  };
};

const officeService = {
  // Get all offices with pagination and filtering
  getOffices: async (params: PaginationParams): Promise<PaginatedResponse<Office>> => {
    try {
      // Basic query parameters
      const queryParams = new URLSearchParams({
        page: params.page.toString(),
        limit: params.pageSize.toString()
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

      const response = await api.get(`/offices?${queryParams.toString()}`);
      
      // If the backend doesn't return paginated data yet, we'll handle it
      if (Array.isArray(response.data)) {
        const offices = response.data.map(mapOfficeDtoToOffice);
        return {
          data: offices,
          meta: {
            total: offices.length,
            page: params.page,
            pageSize: params.pageSize,
            pageCount: Math.ceil(offices.length / params.pageSize)
          }
        };
      }
      
      // If backend returns proper paginated response
      return {
        data: response.data.data.map(mapOfficeDtoToOffice),
        meta: response.data.meta
      };
    } catch (error) {
      console.error('Error fetching offices:', error);
      throw error;
    }
  },

  // Get office hierarchy tree
  getOfficeHierarchy: async (): Promise<Office[]> => {
    try {
      const response = await api.get('/offices/hierarchy');
      return response.data.map(mapOfficeDtoToOffice);
    } catch (error) {
      console.error('Error fetching office hierarchy:', error);
      throw error;
    }
  },

  // Get a single office by ID
  getOfficeById: async (id: string): Promise<Office> => {
    try {
      const response = await api.get(`/offices/${id}`);
      return mapOfficeDtoToOffice(response.data);
    } catch (error) {
      console.error(`Error fetching office ${id}:`, error);
      throw error;
    }
  },

  // Create a new office
  createOffice: async (officeData: CreateOfficeDTO): Promise<Office> => {
    try {
      const response = await api.post('/offices', officeData);
      return mapOfficeDtoToOffice(response.data);
    } catch (error: any) {
      console.error('Error creating office:', error);
      // Log detailed error information
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        
        const errorMessage = error.response.data?.message || 'Failed to create office';
        const enhancedError = new Error(errorMessage);
        enhancedError.name = 'ApiError';
        throw enhancedError;
      } else if (error.request) {
        console.error('Request made but no response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      throw error;
    }
  },

  // Update an existing office
  updateOffice: async (id: string, officeData: UpdateOfficeDTO): Promise<Office> => {
    try {
      const response = await api.patch(`/offices/${id}`, officeData);
      return mapOfficeDtoToOffice(response.data);
    } catch (error: any) {
      console.error(`Error updating office ${id}:`, error);
      const errorMessage = error.response?.data?.message || 'Failed to update office';
      throw new Error(errorMessage);
    }
  },

  // Delete an office
  deleteOffice: async (id: string): Promise<void> => {
    try {
      await api.delete(`/offices/${id}`);
    } catch (error: any) {
      console.error(`Error deleting office ${id}:`, error);
      const errorMessage = error.response?.data?.message || 'Failed to delete office';
      throw new Error(errorMessage);
    }
  }
};

export default officeService; 