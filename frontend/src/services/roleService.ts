import api from '@/lib/api';
import { Role, PaginatedResponse, PaginationParams, Permission } from '@/lib/types';

// Interface for role data from API that matches backend structure
export interface RoleDTO {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  permissions: PermissionDTO[];
  createdAt: string;
  updatedAt: string;
}

// Interface for permission data from API
export interface PermissionDTO {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface for creating a role
export interface CreateRoleDTO {
  name: string;
  description?: string;
  permissionIds?: string[];
}

// Interface for updating a role
export interface UpdateRoleDTO {
  name?: string;
  description?: string;
  permissionIds?: string[];
  isActive?: boolean;
}

// Convert RoleDTO from backend to Role model for frontend
const mapRoleDtoToRole = (roleDto: RoleDTO): Role => {
  return {
    id: roleDto.id,
    name: roleDto.name,
    description: roleDto.description || '',
    status: roleDto.isActive ? 'active' : 'inactive',
    isActive: roleDto.isActive,
    permissions: roleDto.permissions.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      isActive: p.isActive,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    })),
    createdAt: roleDto.createdAt,
    updatedAt: roleDto.updatedAt
  };
};

// Helper function to filter and paginate mock roles
const filterAndPaginateRoles = (
  roles: Role[],
  { page, pageSize, search, filters }: PaginationParams
): PaginatedResponse<Role> => {
  let filteredRoles = [...roles];
  
  // Apply search if provided
  if (search) {
    const searchLower = search.toLowerCase();
    filteredRoles = filteredRoles.filter(role => 
      role.name.toLowerCase().includes(searchLower) ||
      (role.description && role.description.toLowerCase().includes(searchLower))
    );
  }
  
  // Apply filters if provided
  if (filters) {
    if (filters.name) {
      filteredRoles = filteredRoles.filter(role => 
        role.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }
    
    if (filters.status !== undefined) {
      filteredRoles = filteredRoles.filter(role => 
        role.status === filters.status
      );
    }
  }
  
  // Calculate pagination
  const total = filteredRoles.length;
  const pageCount = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginatedRoles = filteredRoles.slice(startIndex, startIndex + pageSize);
  
  return {
    data: paginatedRoles,
    meta: {
      total,
      page,
      pageSize,
      pageCount
    }
  };
};

const roleService = {
  // Get all roles with pagination and filtering
  getRoles: async (params: PaginationParams): Promise<PaginatedResponse<Role>> => {
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

      const response = await api.get(`/roles?${queryParams.toString()}`);
      
      // If the backend doesn't return paginated data yet, we'll mock it
      if (Array.isArray(response.data)) {
        const roles = response.data.map(mapRoleDtoToRole);
        return {
          data: roles,
          meta: {
            total: roles.length,
            page: params.page,
            pageSize: params.pageSize,
            pageCount: Math.ceil(roles.length / params.pageSize)
          }
        };
      }
      
      // If backend returns proper paginated response
      return {
        data: response.data.data.map(mapRoleDtoToRole),
        meta: response.data.meta
      };
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  },

  // Get a single role by ID
  getRoleById: async (id: string): Promise<Role> => {
    try {
      const response = await api.get(`/roles/${id}`);
      return mapRoleDtoToRole(response.data);
    } catch (error) {
      console.error(`Error fetching role ${id}:`, error);
      throw error;
    }
  },

  // Create a new role
  createRole: async (roleData: CreateRoleDTO): Promise<Role> => {
    try {
      const response = await api.post('/roles', roleData);
      return mapRoleDtoToRole(response.data);
    } catch (error: any) {
      console.error('Error creating role:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create role';
      throw new Error(errorMessage);
    }
  },

  // Update an existing role
  updateRole: async (id: string, roleData: UpdateRoleDTO): Promise<Role> => {
    try {
      const response = await api.patch(`/roles/${id}`, roleData);
      return mapRoleDtoToRole(response.data);
    } catch (error: any) {
      console.error(`Error updating role ${id}:`, error);
      const errorMessage = error.response?.data?.message || 'Failed to update role';
      throw new Error(errorMessage);
    }
  },

  // Delete a role
  deleteRole: async (id: string): Promise<void> => {
    try {
      await api.delete(`/roles/${id}`);
    } catch (error: any) {
      console.error(`Error deleting role ${id}:`, error);
      const errorMessage = error.response?.data?.message || 'Failed to delete role';
      throw new Error(errorMessage);
    }
  },

  // Get all permissions
  getPermissions: async (): Promise<Permission[]> => {
    try {
      const response = await api.get('/permissions');
      return response.data.map((p: PermissionDTO) => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        isActive: p.isActive,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      }));
    } catch (error) {
      console.error('Error fetching permissions:', error);
      throw error;
    }
  }
};

export default roleService; 