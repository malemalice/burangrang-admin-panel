/**
 * Menus module types
 */

// Re-export core types that are used by menus module
export type { MenuItem, PaginatedResponse, PaginationParams } from '@/core/lib/types';

// Interface for menu data from API that matches backend structure
export interface MenuDTO {
  id: string;
  name: string;
  path?: string;
  icon?: string;
  parentId?: string;
  order: number;
  isActive: boolean;
  isVisible: boolean;
  permissions?: string[];
  children?: MenuDTO[];
  createdAt: string;
  updatedAt: string;
}

// Interface for creating a menu item
export interface CreateMenuDTO {
  name: string;
  path?: string;
  icon?: string;
  parentId?: string;
  order: number;
  isActive?: boolean;
  isVisible?: boolean;
  permissions?: string[];
}

// Interface for updating a menu item
export interface UpdateMenuDTO {
  name?: string;
  path?: string;
  icon?: string;
  parentId?: string;
  order?: number;
  isActive?: boolean;
  isVisible?: boolean;
  permissions?: string[];
}

// Menu form data for frontend forms
export interface MenuFormData {
  name: string;
  path: string;
  icon: string;
  parentId: string;
  order: number;
  isActive: boolean;
  isVisible: boolean;
  permissions: string[];
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
  path?: string;
  icon?: string;
  children: MenuTreeNode[];
  level: number;
  isExpanded?: boolean;
  isActive: boolean;
  isVisible: boolean;
  order: number;
  permissions?: string[];
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
