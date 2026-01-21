/**
 * Mail Templates module types
 */

// Re-export core types used by this module
export type { PaginatedResponse, PaginationParams } from '@/core/lib/types';

// Backend DTO shape (matches NestJS DTOs)
export interface EmailTemplateDTO {
  id: string;
  code: string;
  name: string;
  subjectTemplate: string;
  bodyTemplate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Frontend model
export interface EmailTemplate {
  id: string;
  code: string;
  name: string;
  subject: string;
  body: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// Create DTO
export interface CreateEmailTemplateDTO {
  code: string;
  name: string;
  subjectTemplate: string;
  bodyTemplate: string;
  isActive?: boolean;
}

// Update DTO
export interface UpdateEmailTemplateDTO {
  name?: string;
  subjectTemplate?: string;
  bodyTemplate?: string;
  isActive?: boolean;
}

// Form data for frontend forms
export interface EmailTemplateFormData {
  code: string;
  name: string;
  subject: string;
  body: string;
  isActive: boolean;
}

// Filters for list page
export interface EmailTemplateFilters {
  code?: string;
  name?: string;
  status?: 'active' | 'inactive' | 'all';
}

// Search params for service layer
export interface EmailTemplateSearchParams extends PaginationParams {
  filters?: EmailTemplateFilters;
}


