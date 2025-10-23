/**
 * Master Data module types
 */

// Re-export core types that are used by master data module
export type { 
  Office, 
  Department, 
  JobPosition, 
  Asset, 
  MasterApproval,
  MasterApprovalItem,
  PaginatedResponse, 
  PaginationParams 
} from '@/core/lib/types';

// =============================================================================
// OFFICE TYPES
// =============================================================================

// Interface for office data from API that matches backend structure
export interface OfficeDTO {
  id: string;
  name: string;
  code: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  parentId?: string;
  children?: OfficeDTO[];
  parent?: OfficeDTO;
  users?: any[]; // User type from core
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface for creating an office
export interface CreateOfficeDTO {
  name: string;
  code: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  parentId?: string;
  isActive?: boolean;
}

// Interface for updating an office
export interface UpdateOfficeDTO {
  name?: string;
  code?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  parentId?: string;
  isActive?: boolean;
}

// =============================================================================
// DEPARTMENT TYPES
// =============================================================================

// Interface for department data from API that matches backend structure
export interface DepartmentDTO {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface for creating a department
export interface CreateDepartmentDTO {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
}

// Interface for updating a department
export interface UpdateDepartmentDTO {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

// =============================================================================
// JOB POSITION TYPES
// =============================================================================

// Interface for job position data from API that matches backend structure
export interface JobPositionDTO {
  id: string;
  name: string;
  code: string;
  level: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface for creating a job position
export interface CreateJobPositionDTO {
  name: string;
  code: string;
  level: number;
  description?: string;
  isActive?: boolean;
}

// Interface for updating a job position
export interface UpdateJobPositionDTO {
  name?: string;
  code?: string;
  level?: number;
  description?: string;
  isActive?: boolean;
}

// =============================================================================
// MASTER APPROVAL TYPES
// =============================================================================

// Interface for master approval data from API that matches backend structure
export interface MasterApprovalDTO {
  id: string;
  entity: string;
  isActive: boolean;
  items: MasterApprovalItemDTO[];
  createdAt: string;
  updatedAt: string;
}

// Interface for master approval item data from API
export interface MasterApprovalItemDTO {
  id: string;
  mApprovalId: string;
  order: number;
  job_position_id: string;
  department_id: string;
  createdBy: string;
  createdAt: string;
  jobPosition: {
    id: string;
    name: string;
  };
  department: {
    id: string;
    name: string;
  };
  creator: {
    id: string;
    name: string;
  };
}

// Interface for creating a master approval
export interface CreateMasterApprovalDTO {
  entity: string;
  isActive?: boolean;
  items: Array<{
    order: number;
    job_position_id: string;
    department_id: string;
  }>;
}

// Interface for updating a master approval
export interface UpdateMasterApprovalDTO {
  entity?: string;
  isActive?: boolean;
  items?: Array<{
    id?: string;
    order: number;
    job_position_id: string;
    department_id: string;
  }>;
}

// =============================================================================
// FORM DATA TYPES
// =============================================================================

// Office form data for frontend forms
export interface OfficeFormData {
  name: string;
  code: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  parentId: string;
  isActive: boolean;
}

// Department form data for frontend forms
export interface DepartmentFormData {
  name: string;
  code: string;
  description: string;
  isActive: boolean;
}

// Job position form data for frontend forms
export interface JobPositionFormData {
  name: string;
  code: string;
  level: number;
  description: string;
  isActive: boolean;
}

// Master approval form data for frontend forms
export interface MasterApprovalFormData {
  entity: string;
  isActive: boolean;
  items: Array<{
    order: number;
    job_position_id: string;
    department_id: string;
  }>;
}

// =============================================================================
// FILTER AND SEARCH TYPES
// =============================================================================

// Office filter options
export interface OfficeFilters {
  name?: string;
  code?: string;
  parentId?: string;
  hasChildren?: boolean;
  status?: 'active' | 'inactive' | 'all';
  hasUsers?: boolean;
  createdAfter?: string;
  createdBefore?: string;
}

// Department filter options
export interface DepartmentFilters {
  name?: string;
  code?: string;
  status?: 'active' | 'inactive' | 'all';
  createdAfter?: string;
  createdBefore?: string;
}

// Job position filter options
export interface JobPositionFilters {
  name?: string;
  code?: string;
  level?: number;
  minLevel?: number;
  maxLevel?: number;
  status?: 'active' | 'inactive' | 'all';
  createdAfter?: string;
  createdBefore?: string;
}

// Master approval filter options
export interface MasterApprovalFilters {
  entity?: string;
  status?: 'active' | 'inactive' | 'all';
  hasItems?: boolean;
  createdAfter?: string;
  createdBefore?: string;
}

// Search parameters for each entity
export interface OfficeSearchParams extends PaginationParams {
  filters?: OfficeFilters;
}

export interface DepartmentSearchParams extends PaginationParams {
  filters?: DepartmentFilters;
}

export interface JobPositionSearchParams extends PaginationParams {
  filters?: JobPositionFilters;
}

export interface MasterApprovalSearchParams extends PaginationParams {
  filters?: MasterApprovalFilters;
}

// =============================================================================
// STATISTICS TYPES
// =============================================================================

// Master data statistics for dashboard/reporting
export interface MasterDataStats {
  offices: {
    total: number;
    active: number;
    inactive: number;
    withChildren: number;
    withUsers: number;
  };
  departments: {
    total: number;
    active: number;
    inactive: number;
  };
  jobPositions: {
    total: number;
    active: number;
    inactive: number;
    byLevel: Array<{
      level: number;
      count: number;
    }>;
  };
  masterApprovals: {
    total: number;
    active: number;
    inactive: number;
    byEntity: Array<{
      entity: string;
      count: number;
    }>;
  };
}
