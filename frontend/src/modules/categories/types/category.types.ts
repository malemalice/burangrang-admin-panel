/**
 * Categories module types
 */

// Pagination parameters for API requests
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

// Paginated response structure
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pageCount: number;
  };
}

// Interface for category data from API that matches backend structure
export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parent?: CategoryDTO;
  children?: CategoryDTO[];
}

// Interface for creating a category
export interface CreateCategoryDTO {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  order?: number;
  isActive?: boolean;
}

// Interface for updating a category
export interface UpdateCategoryDTO {
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  order?: number;
  isActive?: boolean;
}

// Category form data for frontend forms
export interface CategoryFormData {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  order: number;
  isActive: boolean;
}

// Category filter options
export interface CategoryFilters {
  name?: string;
  slug?: string;
  parentId?: string;
  status?: 'active' | 'inactive' | 'all';
  createdAfter?: string;
  createdBefore?: string;
}

// Category search parameters
export interface CategorySearchParams extends PaginationParams {
  filters?: CategoryFilters;
}

// Category statistics for dashboard/reporting
export interface CategoryStats {
  total: number;
  active: number;
  inactive: number;
  rootCategories: number;
  subCategories: number;
  byLevel: Array<{
    level: number;
    count: number;
  }>;
  recentCreated: number;
  recentUpdated: number;
}

// Category hierarchy for tree display
export interface CategoryHierarchy {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  order: number;
  isActive: boolean;
  level: number;
  children: CategoryHierarchy[];
}
