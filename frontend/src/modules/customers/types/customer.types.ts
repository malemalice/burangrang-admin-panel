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
  userId?: string; // Optional - will create user if not provided
  // User creation fields (required if userId is not provided)
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
  officeId?: string;
  departmentId?: string;
  jobPositionId?: string;
  // Customer fields
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  dateOfBirth?: string;
  gender?: string;
  isActive?: boolean;
}

export interface UpdateCustomerDTO {
  userId?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  dateOfBirth?: string;
  gender?: string;
  isActive?: boolean;
}

// Form and UI types
export interface CustomerFormData {
  // User selection mode
  userId: string;
  // User creation fields (when creating new user)
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: string;
  officeId: string;
  departmentId: string;
  jobPositionId: string;
  // Customer fields
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  dateOfBirth: string;
  gender: string;
  isActive: boolean;
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
