import { User } from '@/modules/users/types/user.types';

// Customer DTO from backend
export interface CustomerDTO {
  id: string;
  userId: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  dateOfBirth?: string;
  gender?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

// Frontend Customer model
export interface Customer {
  id: string;
  userId: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  dateOfBirth?: string;
  gender?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

// CRUD operation types
export interface CreateCustomerDTO {
  // Essential fields for lean form
  firstName: string;
  lastName: string;
  // Phone OR Email required (at least one)
  phone?: string;
  email?: string;
  // Optional user fields (will use defaults if not provided)
  departmentId?: string;
  jobPositionId?: string;
  // Optional customer-specific fields (hidden by default in lean form)
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  dateOfBirth?: string;
  gender?: string;
}

export interface UpdateCustomerDTO {
  // Only customer-specific fields can be updated (no user fields)
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  dateOfBirth?: string;
  gender?: string;
}

// Form and UI types
export interface CustomerFormData {
  // Essential fields for lean form
  firstName: string;
  lastName: string;
  // Phone OR Email required (at least one)
  phone: string;
  email: string;
  // Optional user fields
  departmentId: string;
  jobPositionId: string;
  // Optional customer-specific fields (hidden by default in lean form)
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  dateOfBirth: string;
  gender: string;
}

export interface CustomerFilters {
  search?: string;
  city?: string;
  country?: string;
  isActive?: boolean;
}

export interface CustomerSearchParams {
  page: number;
  limit: number;
  search?: string;
  city?: string;
  country?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Statistics and analytics
export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  customersWithOrders: number;
}

// Common shared types (from core)
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
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

// Filter field configuration for DataTable
export interface FilterField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'searchableSelect';
  options?: { label: string; value: string }[];
}
