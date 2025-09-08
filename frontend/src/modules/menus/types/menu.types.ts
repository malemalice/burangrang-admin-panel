/**
 * Menus module types
 */

// Re-export core types that are used by menus module
export type { MenuItem, PaginatedResponse, PaginationParams } from '@/core/lib/types';

// Interface for menu data from API that matches backend MenuDto structure
export interface MenuDTO {
  id: string;
  name: string;
  path?: string | null;
  icon?: string | null;
  parentId?: string | null;
  parent?: MenuDTO | null;
  children?: Partial<MenuDTO>[];
  order: number;
  isActive: boolean;
  roles: RoleDTO[];
  createdAt: Date;
  updatedAt: Date;
}

// Role DTO to match backend structure
export interface RoleDTO {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Interface for creating a menu item - matches backend CreateMenuDto
export interface CreateMenuDTO {
  name: string;
  path?: string;
  icon?: string;
  parentId?: string;
  order: number;
  isActive: boolean;
  roleIds?: string[]; // For role assignment
}

// Interface for updating a menu item - matches backend UpdateMenuDto
export interface UpdateMenuDTO {
  name?: string;
  path?: string;
  icon?: string;
  parentId?: string;
  order?: number;
  isActive?: boolean;
  roleIds?: string[]; // For role assignment
}

// Menu form data for frontend forms
export interface MenuFormData {
  name: string;
  path: string;
  icon: string;
  parentId: string; // Can be "none" for root level, will be converted to undefined
  order: number;
  isActive: boolean;
  roleIds: string[]; // Selected role IDs for the menu
}

// Menu filter options
export interface MenuFilters {
  name?: string;
  path?: string;
  parentId?: string;
  isActive?: boolean;
  isVisible?: boolean;
  hasPermissions?: boolean;
  createdAfter?: string;
  createdBefore?: string;
}

// Menu search parameters
export interface MenuSearchParams extends PaginationParams {
  filters?: MenuFilters;
}

// Menu hierarchy and tree structure
export interface MenuTreeNode {
  id: string;
  name: string;
  path?: string | null;
  icon?: string | null;
  children: MenuTreeNode[];
  level: number;
  isExpanded?: boolean;
  isActive: boolean;
  order: number;
  roles: RoleDTO[];
}

// Menu statistics for dashboard/reporting
export interface MenuStats {
  total: number;
  active: number;
  visible: number;
  withChildren: number;
  byPermissionCount: Array<{
    range: string;
    count: number;
  }>;
  topLevelMenus: number;
  deepestLevel: number;
  recentlyCreated: number;
}

// Menu assignment data
export interface MenuPermissionAssignment {
  id: string;
  menuId: string;
  permissionId: string;
  assignedBy: string;
  assignedAt: string;
  isActive: boolean;
}

// Menu category for better organization
export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  order: number;
  menuItems: MenuDTO[];
}

// Navigation breadcrumb data
export interface BreadcrumbItem {
  id: string;
  name: string;
  path?: string;
  isActive: boolean;
}

// Menu access control
export interface MenuAccessControl {
  menuId: string;
  userId: string;
  roleIds: string[];
  permissionIds: string[];
  canAccess: boolean;
  restrictions?: string[];
}

// Menu validation schemas
export interface MenuValidationRules {
  name: {
    required: boolean;
    minLength: number;
    maxLength: number;
  };
  path: {
    required: boolean;
    pattern?: string;
  };
  icon: {
    required: boolean;
    allowedValues?: string[];
  };
  order: {
    required: boolean;
    min: number;
    max: number;
  };
}

// Menu import/export data
export interface MenuImportData {
  menus: MenuDTO[];
  validationErrors?: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

export interface MenuExportData {
  menus: MenuDTO[];
  exportedAt: string;
  exportedBy: string;
  version: string;
}
