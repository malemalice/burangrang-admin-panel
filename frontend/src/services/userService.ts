import api from '@/lib/api';
import { User, PaginatedResponse, PaginationParams } from '@/lib/types';

// Interface for user data from API that matches backend structure
export interface UserDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roleId: string;
  officeId: string;
  role?: {
    id: string;
    name: string;
  };
  office?: {
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
}

// Interface for updating a user
export interface UpdateUserDTO {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
  officeId?: string;
  isActive?: boolean;
}

// Convert UserDTO from backend to User model for frontend
const mapUserDtoToUser = (userDto: UserDTO): User => {
  return {
    id: userDto.id,
    name: `${userDto.firstName} ${userDto.lastName}`,
    email: userDto.email,
    roleId: userDto.roleId,
    role: userDto.role?.name,
    office: userDto.office?.name,
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
    isActive: user.status === 'active'
  };
};

const userService = {
  // Get all users with pagination and filtering
  getUsers: async (params: PaginationParams): Promise<PaginatedResponse<User>> => {
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

      const response = await api.get(`/users?${queryParams.toString()}`);
      
      // If the backend doesn't return paginated data yet, we'll mock it
      // This can be adjusted once pagination is implemented on the backend
      if (Array.isArray(response.data)) {
        const users = response.data.map(mapUserDtoToUser);
        return {
          data: users,
          meta: {
            total: users.length,
            page: params.page,
            pageSize: params.pageSize,
            pageCount: Math.ceil(users.length / params.pageSize)
          }
        };
      }
      
      // If backend returns proper paginated response
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
      console.log('Sending user data to API:', JSON.stringify(userData, null, 2));
      const response = await api.post('/users', userData);
      return mapUserDtoToUser(response.data);
    } catch (error: any) {
      console.error('Error creating user:', error);
      // Log detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        
        // Return a more detailed error message that includes the server's response
        const errorMessage = error.response.data?.message || 'Failed to create user';
        const enhancedError = new Error(errorMessage);
        enhancedError.name = 'ApiError';
        throw enhancedError;
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Request made but no response received:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', error.message);
      }
      throw error;
    }
  },

  // Update an existing user
  updateUser: async (id: string, userData: UpdateUserDTO): Promise<User> => {
    try {
      const response = await api.patch(`/users/${id}`, userData);
      return mapUserDtoToUser(response.data);
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  },

  // Delete a user
  deleteUser: async (id: string): Promise<void> => {
    try {
      await api.delete(`/users/${id}`);
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }
};

export default userService; 