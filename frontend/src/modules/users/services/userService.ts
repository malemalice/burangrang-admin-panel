import api from '@/core/lib/api';
import { 
  User, 
  PaginatedResponse, 
  PaginationParams,
  UserDTO,
  CreateUserDTO,
  CreateGuestWorkerDTO,
  CreateWorkPermitWorkerDTO,
  UpdateUserDTO 
} from '../types/user.types';

// Convert UserDTO from backend to User model for frontend
const mapUserDtoToUser = (userDto: UserDTO): User => {
  return {
    id: userDto.id,
    name: `${userDto.firstName} ${userDto.lastName}`,
    email: userDto.email,
    firstName: userDto.firstName,
    lastName: userDto.lastName,
    roleId: userDto.roleId,
    officeId: userDto.officeId,
    departmentId: userDto.departmentId,
    jobPositionId: userDto.jobPositionId,
    companyId: userDto.companyId ?? undefined,
    company: userDto.company?.name,
    role: userDto.role?.name,
    office: userDto.office?.name,
    department: userDto.department?.name,
    position: userDto.jobPosition?.name,
    status: userDto.isActive ? 'active' : 'inactive',
    isActive: userDto.isActive,
    lastLogin: userDto.lastLoginAt || undefined,
    lastLoginAt: userDto.lastLoginAt ? new Date(userDto.lastLoginAt) : undefined,
    createdAt: userDto.createdAt,
    updatedAt: userDto.updatedAt
  };
};

// Convert User from frontend to UpdateUserDTO for backend
const mapUserToUpdateDto = (user: Partial<User>): UpdateUserDTO => {
  // Split name into first and last name if provided
  let firstName, lastName;
  if (user.name) {
    const nameParts = user.name.split(' ');
    firstName = nameParts[0];
    lastName = nameParts.slice(1).join(' ');
  }

  return {
    email: user.email,
    firstName,
    lastName,
    roleId: user.roleId,
    officeId: user.officeId,
    departmentId: user.departmentId,
    jobPositionId: user.jobPositionId,
    isActive: user.status === 'active'
  };
};

const userService = {
  getAll: async (params: PaginationParams): Promise<PaginatedResponse<User>> => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Get all users with pagination and filtering
  getUsers: async (params: PaginationParams): Promise<PaginatedResponse<User>> => {
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

      const response = await api.get(`/users?${queryParams.toString()}`);
      return {
        data: response.data.data.map(mapUserDtoToUser),
        meta: response.data.meta
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get a single user by ID
  getUserById: async (id: string): Promise<User> => {
    try {
      const response = await api.get(`/users/${id}`);
      return mapUserDtoToUser(response.data);
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  },

  // Create a new user
  createUser: async (userData: CreateUserDTO): Promise<User> => {
    try {
      const response = await api.post('/users', userData);
      return mapUserDtoToUser(response.data);
    } catch (error: any) {
      console.error('Error creating user:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create user';
      throw new Error(errorMessage);
    }
  },

  // Create a guest worker (Guest role, random password; for work permit workers)
  createGuestWorker: async (data: CreateGuestWorkerDTO): Promise<User> => {
    try {
      const response = await api.post('/users/guest-worker', data);
      return mapUserDtoToUser(response.data);
    } catch (error: any) {
      console.error('Error creating guest worker:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create worker';
      throw new Error(errorMessage);
    }
  },

  createWorkPermitWorker: async (data: CreateWorkPermitWorkerDTO): Promise<User> => {
    try {
      const response = await api.post('/users/work-permit-worker', data);
      return mapUserDtoToUser(response.data);
    } catch (error: any) {
      console.error('Error creating work permit worker:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create worker';
      throw new Error(errorMessage);
    }
  },

  // Update an existing user
  updateUser: async (id: string, userData: UpdateUserDTO): Promise<User> => {
    try {
      const response = await api.patch(`/users/${id}`, userData);
      return mapUserDtoToUser(response.data);
    } catch (error: any) {
      console.error(`Error updating user ${id}:`, error);
      const errorMessage = error.response?.data?.message || 'Failed to update user';
      throw new Error(errorMessage);
    }
  },

  // Delete a user
  deleteUser: async (id: string): Promise<void> => {
    try {
      await api.delete(`/users/${id}`);
    } catch (error: any) {
      console.error(`Error deleting user ${id}:`, error);
      const errorMessage = error.response?.data?.message || 'Failed to delete user';
      throw new Error(errorMessage);
    }
  },

  // Send password reset email to a user by email
  sendResetPasswordEmail: async (email: string): Promise<{ message: string }> => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error: any) {
      console.error(`Error sending reset password email to ${email}:`, error);
      const errorMessage = error.response?.data?.message || 'Failed to send reset password email';
      throw new Error(errorMessage);
    }
  },

  // Get user permissions
  getUserPermissions: async (userId: string): Promise<any[]> => {
    try {
      const response = await api.get(`/users/${userId}/permissions`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching permissions for user ${userId}:`, error);
      throw error;
    }
  },

  // Assign permissions to user
  assignPermissions: async (userId: string, permissionNames: string[]): Promise<any[]> => {
    try {
      const response = await api.post(`/users/${userId}/permissions`, { permissionNames });
      return response.data;
    } catch (error) {
      console.error(`Error assigning permissions to user ${userId}:`, error);
      throw error;
    }
  },

  // Remove permission from user
  removePermission: async (userId: string, permissionName: string): Promise<void> => {
    try {
      await api.delete(`/users/${userId}/permissions/${permissionName}`);
    } catch (error) {
      console.error(`Error removing permission ${permissionName} from user ${userId}:`, error);
      throw error;
    }
  }
};

export default userService; 