/**
 * Product Types module types
 */

// Re-export core types that are used by product-types module
export type { PaginatedResponse, PaginationParams } from '@/core/lib/types';

// Interface for product type data from API that matches backend structure
export interface ProductTypeDTO {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface for creating a product type
export interface CreateProductTypeDTO {
  name: string;
  description?: string;
  isActive?: boolean;
}

// Interface for updating a product type
export interface UpdateProductTypeDTO {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// Product type form data for frontend forms
export interface ProductTypeFormData {
  name: string;
  description?: string;
  isActive: boolean;
}

// Product type filter options
export interface ProductTypeFilters {
  name?: string;
  status?: 'active' | 'inactive' | 'all';
  createdAfter?: string;
  createdBefore?: string;
}

// Product type search parameters
export interface ProductTypeSearchParams extends PaginationParams {
  filters?: ProductTypeFilters;
}

// Product type statistics for dashboard/reporting
export interface ProductTypeStats {
  total: number;
  active: number;
  inactive: number;
  recentlyCreated: number;
}
