import api from '@/core/lib/api';
import { User, PaginatedResponse, PaginationParams } from '@/core/lib/types';

// Interface for user data from API that matches backend structure
export interface UserDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roleId: string;
  officeId: string;
  departmentId?: string;
  jobPositionId?: string;
  role?: {
    id: string;
    name: string;
  };
  office?: {
    id: string;
    name: string;
  };
  department?: {
    id: string;
    name: string;
  };
  jobPosition?: {
    id: string;
    name: string;
  };
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Interface for creating a user
export interface CreateUserDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: string;
  officeId: string;
  departmentId?: string;
  jobPositionId?: string;
}

// Interface for updating a user
export interface UpdateUserDTO {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
  officeId?: string;
  departmentId?: string;
  jobPositionId?: string;
  isActive?: boolean;
}

// Convert UserDTO from backend to User model for frontend
const mapUserDtoToUser = (userDto: UserDTO): User => {
  return {
    id: userDto.id,
    name: `${userDto.firstName} ${userDto.lastName}`,
    email: userDto.email,
    roleId: userDto.roleId,
    officeId: userDto.officeId,
    departmentId: userDto.departmentId,
    jobPositionId: userDto.jobPositionId,
    role: userDto.role?.name,
    office: userDto.office?.name,
    department: userDto.department?.name,
    position: userDto.jobPosition?.name,
    status: userDto.isActive ? 'active' : 'inactive',
    lastLogin: userDto.lastLoginAt || undefined,
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
  }
};

export default userService; 