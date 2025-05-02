import api from '@/lib/api';
import { Role, PaginatedResponse, PaginationParams, Permission } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

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

// Mock permissions data
const MOCK_PERMISSIONS: Permission[] = [
  {
    id: '1',
    name: 'Create User',
    description: 'Permission to create users',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Edit User',
    description: 'Permission to edit users',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Delete User',
    description: 'Permission to delete users',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'View User',
    description: 'Permission to view users',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Create Role',
    description: 'Permission to create roles',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '6',
    name: 'Edit Role',
    description: 'Permission to edit roles',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '7',
    name: 'Delete Role',
    description: 'Permission to delete roles',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '8',
    name: 'View Role',
    description: 'Permission to view roles',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Mock roles data with permissions
let MOCK_ROLES: Role[] = [
  {
    id: 'role-1',
    name: 'Administrator',
    description: 'Full access to all features',
    permissions: MOCK_PERMISSIONS,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role-2',
    name: 'Manager',
    description: 'Manage department resources and users',
    permissions: MOCK_PERMISSIONS.slice(0, 4),
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role-3',
    name: 'User',
    description: 'Basic user access',
    permissions: [MOCK_PERMISSIONS[3]], // Only View User permission
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Convert RoleDTO from backend to Role model for frontend
const mapRoleDtoToRole = (roleDto: RoleDTO): Role => {
  return {
    id: roleDto.id,
    name: roleDto.name,
    description: roleDto.description || '',
    permissions: roleDto.permissions || [],
    isActive: roleDto.isActive,
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
    
    if (filters.isActive !== undefined) {
      filteredRoles = filteredRoles.filter(role => 
        role.isActive === (filters.isActive === true || filters.isActive === 'active')
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
      // In a real app, this would make an API call
      // const response = await api.get(`/roles?${queryParams.toString()}`);
      
      // For now, use mock data with filtering and pagination
      return Promise.resolve(filterAndPaginateRoles(MOCK_ROLES, params));
    } catch (error) {
      console.error('Error fetching roles:', error);
      // Fallback to mock data if API call fails
      return filterAndPaginateRoles(MOCK_ROLES, params);
    }
  },

  // Get a single role by ID
  getRoleById: async (id: string): Promise<Role> => {
    try {
      // In a real app: const response = await api.get(`/roles/${id}`);
      
      // For now, find the role in our mock data
      const role = MOCK_ROLES.find(role => role.id === id);
      if (!role) {
        throw new Error(`Role with ID ${id} not found`);
      }
      
      return Promise.resolve(role);
    } catch (error) {
      console.error(`Error fetching role ${id}:`, error);
      throw error;
    }
  },

  // Create a new role
  createRole: async (roleData: CreateRoleDTO): Promise<Role> => {
    try {
      console.log('Creating role with data:', JSON.stringify(roleData, null, 2));
      
      // In a real app: const response = await api.post('/roles', roleData);
      
      // Create new role with mock data
      const newRole: Role = {
        id: uuidv4(),
        name: roleData.name,
        description: roleData.description || '',
        isActive: true,
        permissions: roleData.permissionIds 
          ? MOCK_PERMISSIONS.filter(p => roleData.permissionIds?.includes(p.id))
          : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Add to our mock roles array
      MOCK_ROLES.push(newRole);
      
      return Promise.resolve(newRole);
    } catch (error: any) {
      console.error('Error creating role:', error);
      throw error;
    }
  },

  // Update an existing role
  updateRole: async (id: string, roleData: UpdateRoleDTO): Promise<Role> => {
    try {
      // In a real app: const response = await api.patch(`/roles/${id}`, roleData);
      
      // Find and update the role in our mock data
      const roleIndex = MOCK_ROLES.findIndex(role => role.id === id);
      if (roleIndex === -1) {
        throw new Error(`Role with ID ${id} not found`);
      }
      
      // Update the role data
      const updatedRole = {
        ...MOCK_ROLES[roleIndex],
        name: roleData.name || MOCK_ROLES[roleIndex].name,
        description: roleData.description !== undefined ? roleData.description : MOCK_ROLES[roleIndex].description,
        isActive: roleData.isActive !== undefined ? roleData.isActive : MOCK_ROLES[roleIndex].isActive,
        permissions: roleData.permissionIds 
          ? MOCK_PERMISSIONS.filter(p => roleData.permissionIds?.includes(p.id))
          : MOCK_ROLES[roleIndex].permissions,
        updatedAt: new Date().toISOString()
      };
      
      // Update the mock roles array
      MOCK_ROLES[roleIndex] = updatedRole;
      
      return Promise.resolve(updatedRole);
    } catch (error) {
      console.error(`Error updating role ${id}:`, error);
      throw error;
    }
  },

  // Delete a role
  deleteRole: async (id: string): Promise<void> => {
    try {
      // In a real app: await api.delete(`/roles/${id}`);
      
      // Find and remove the role from our mock data
      const roleIndex = MOCK_ROLES.findIndex(role => role.id === id);
      if (roleIndex === -1) {
        throw new Error(`Role with ID ${id} not found`);
      }
      
      // Remove the role
      MOCK_ROLES = MOCK_ROLES.filter(role => role.id !== id);
      
      return Promise.resolve();
    } catch (error) {
      console.error(`Error deleting role ${id}:`, error);
      throw error;
    }
  },

  // Get all permissions
  getPermissions: async (): Promise<Permission[]> => {
    try {
      // In a real app: const response = await api.get('/permissions');
      
      // Return mock permissions
      return Promise.resolve(MOCK_PERMISSIONS);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return MOCK_PERMISSIONS; // Fallback to mock data if API call fails
    }
  }
};

export default roleService; 