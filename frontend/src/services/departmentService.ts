import api from '@/lib/api';
import { Department, PaginatedResponse, PaginationParams } from '@/lib/types';

// Interface for department data from API that matches backend structure
export interface DepartmentDTO {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface for creating a department
export interface CreateDepartmentDTO {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
}

// Interface for updating a department
export interface UpdateDepartmentDTO {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

// Convert DepartmentDTO from backend to Department model for frontend
const mapDepartmentDtoToDepartment = (departmentDto: DepartmentDTO): Department => {
  return {
    id: departmentDto.id,
    name: departmentDto.name,
    code: departmentDto.code,
    description: departmentDto.description || '',
    isActive: departmentDto.isActive,
    createdAt: departmentDto.createdAt,
    updatedAt: departmentDto.updatedAt
  };
};

const departmentService = {
  // Get all departments with pagination and filtering
  async getDepartments(params: PaginationParams): Promise<PaginatedResponse<Department>> {
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

      const response = await api.get(`/departments?${queryParams.toString()}`);
      return {
        data: response.data.data.map(mapDepartmentDtoToDepartment),
        meta: response.data.meta
      };
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  },

  // Get a single department by ID
  async getDepartment(id: string): Promise<Department> {
    const response = await api.get(`/departments/${id}`);
    return mapDepartmentDtoToDepartment(response.data);
  },

  // Create a new department
  async createDepartment(data: CreateDepartmentDTO): Promise<Department> {
    const response = await api.post('/departments', data);
    return mapDepartmentDtoToDepartment(response.data);
  },

  // Update an existing department
  async updateDepartment(id: string, data: UpdateDepartmentDTO): Promise<Department> {
    const response = await api.patch(`/departments/${id}`, data);
    return mapDepartmentDtoToDepartment(response.data);
  },

  // Delete a department
  async deleteDepartment(id: string): Promise<void> {
    await api.delete(`/departments/${id}`);
  },

  // Get department by code
  async getDepartmentByCode(code: string): Promise<Department | null> {
    try {
      const response = await api.get(`/departments/code/${code}`);
      return mapDepartmentDtoToDepartment(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }
};

export default departmentService; 