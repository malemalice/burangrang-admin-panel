/**
 * Roles module types
 */

// Re-export core types that are used by roles module
export type { Role, Permission, PaginatedResponse, PaginationParams } from '@/core/lib/types';

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
  permissions?: string[];
  isActive?: boolean;
}

// Interface for updating a role
export interface UpdateRoleDTO {
  name?: string;
  description?: string;
  permissions?: string[];
  isActive?: boolean;
}

// Role form data for frontend forms
export interface RoleFormData {
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
}

// Role filter options
export interface RoleFilters {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive' | 'all';
  hasPermissions?: boolean;
  permissionIds?: string[];
  createdAfter?: string;
  createdBefore?: string;
}

// Role search parameters
export interface RoleSearchParams extends PaginationParams {
  filters?: RoleFilters;
}

// Permission group for organizing permissions
export interface PermissionGroup {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
}

// Role statistics for dashboard/reporting
export interface RoleStats {
  total: number;
  active: number;
  inactive: number;
  byPermissionCount: Array<{
    range: string;
    count: number;
  }>;
  mostUsedPermissions: Array<{
    permissionId: string;
    permissionName: string;
    roleCount: number;
  }>;
  recentlyCreated: number;
  usersWithRoles: number;
}

// Role assignment data
export interface RoleAssignment {
  id: string;
  roleId: string;
  userId: string;
  assignedBy: string;
  assignedAt: string;
  expiresAt?: string;
  isActive: boolean;
}

// Permission category for better organization
export interface PermissionCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  order: number;
  permissions: Permission[];
}
