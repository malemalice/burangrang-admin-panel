/**
 * Users module types
 */

// Re-export core types that are used by users module
export type { User, PaginatedResponse, PaginationParams } from '@/core/lib/types';

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

// User form data for frontend forms
export interface UserFormData {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  roleId: string;
  officeId: string;
  departmentId?: string;
  jobPositionId?: string;
  isActive: boolean;
}

// User filter options
export interface UserFilters {
  name?: string;
  email?: string;
  role?: string;
  office?: string;
  department?: string;
  jobPosition?: string;
  status?: 'active' | 'inactive' | 'all';
  createdAfter?: string;
  createdBefore?: string;
}

// User search parameters
export interface UserSearchParams extends PaginationParams {
  filters?: UserFilters;
}

// User statistics for dashboard/reporting
export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: Array<{
    roleId: string;
    roleName: string;
    count: number;
  }>;
  byOffice: Array<{
    officeId: string;
    officeName: string;
    count: number;
  }>;
  recentLogins: number;
  newThisMonth: number;
}
