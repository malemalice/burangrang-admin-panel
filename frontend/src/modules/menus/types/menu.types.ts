/**
 * Menu module types
 * Following TRD.md patterns for type definitions
 */

// Backend DTO types (matching backend MenuDto)
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

export interface RoleDTO {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Frontend model types
export interface Menu {
  id: string;
  name: string;
  path?: string | null;
  icon?: string | null;
  parentId?: string | null;
  parent?: Menu | null;
  children?: Menu[];
  order: number;
  isActive: boolean;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// CRUD operation types
export interface CreateMenuDTO {
  name: string;
  path?: string;
  icon?: string;
  parentId?: string;
  order: number;
  isActive: boolean;
  roleIds?: string[];
}

export interface UpdateMenuDTO {
  name?: string;
  path?: string;
  icon?: string;
  parentId?: string;
  order?: number;
  isActive?: boolean;
  roleIds?: string[];
}

// Form and UI types
export interface MenuFormData {
  name: string;
  path: string;
  icon: string;
  parentId: string;
  order: number;
  isActive: boolean;
  roleIds: string[];
}

export interface MenuFilters {
  search?: string;
  isActive?: boolean;
  parentId?: string;
  roleId?: string;
}

export interface MenuSearchParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: MenuFilters;
}

// Statistics and analytics
export interface MenuStats {
  total: number;
  active: number;
  visible: number;
  withChildren: number;
  topLevelMenus: number;
  deepestLevel: number;
}

// Common shared types
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

// Sidebar specific types
export interface SidebarMenu extends Menu {
  // Additional properties for sidebar rendering
  isExpanded?: boolean;
  isSelected?: boolean;
  level?: number;
}

// Icon mapping type for dynamic icon rendering
export interface IconMapping {
  [key: string]: React.ComponentType<{ className?: string }>;
}