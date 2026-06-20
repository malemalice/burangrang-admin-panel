/**
 * Master Data module types
 */

// Import core types that are used by master data module
import type { 
  Office, 
  Department, 
  JobPosition, 
  Asset, 
  MasterApproval,
  MasterApprovalItem,
  PaginatedResponse, 
  PaginationParams 
} from '@/core/lib/types';

// Re-export for external usage
export type { 
  Office, 
  Department, 
  JobPosition, 
  Asset, 
  MasterApproval,
  MasterApprovalItem,
  PaginatedResponse, 
  PaginationParams 
};

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
  users?: Array<{ id: string; firstName: string; lastName: string; email: string }>;
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
  emails?: string[] | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface for creating a department
export interface CreateDepartmentDTO {
  name: string;
  code: string;
  description?: string;
  emails?: string[] | null;
  isActive?: boolean;
}

// Interface for updating a department
export interface UpdateDepartmentDTO {
  name?: string;
  code?: string;
  description?: string;
  emails?: string[] | null;
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
  jobPositionId: string;
  departmentId: string;
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
    jobPositionId: string;
    departmentId: string;
  }>;
}

// Interface for updating a master approval
export interface UpdateMasterApprovalDTO {
  entity?: string;
  isActive?: boolean;
  items?: Array<{
    id?: string;
    order: number;
    jobPositionId: string;
    departmentId: string;
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
  emails: string[];
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
    jobPositionId: string;
    departmentId: string;
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

// =============================================================================
// ROOM TYPES
// =============================================================================

// Interface for room data from API
export interface RoomDTO {
  id: string;
  name: string;
  code: string;
  description?: string;
  areaId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  area?: {
    id: string;
    name: string;
    code: string;
  };
}

// Interface for creating a room
export interface CreateRoomDTO {
  name: string;
  code: string;
  description?: string;
  areaId: string;
  isActive?: boolean;
}

// Interface for updating a room
export interface UpdateRoomDTO {
  name?: string;
  code?: string;
  description?: string;
  areaId?: string;
  isActive?: boolean;
}

// Room form data for frontend forms
export interface RoomFormData {
  name: string;
  code: string;
  description: string;
  areaId: string;
  isActive: boolean;
}

// Room filter options
export interface RoomFilters {
  name?: string;
  code?: string;
  areaId?: string;
  status?: 'active' | 'inactive' | 'all';
}

// =============================================================================
// AREA TYPES (for Room dropdown)
// =============================================================================

export interface AreaDTO {
  id: string;
  name: string;
  code: string;
  description?: string;
  officeId?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  office?: {
    id: string;
    name: string;
    code: string;
  };
}

// Interface for creating an area
export interface CreateAreaDTO {
  name: string;
  code: string;
  description?: string;
  officeId?: string;
  isActive?: boolean;
}

// Interface for updating an area
export interface UpdateAreaDTO {
  name?: string;
  code?: string;
  description?: string;
  officeId?: string;
  isActive?: boolean;
}

// Area form data for frontend forms
export interface AreaFormData {
  name: string;
  code: string;
  description: string;
  officeId: string;
  isActive: boolean;
}

// Area filter options
export interface AreaFilters {
  name?: string;
  code?: string;
  officeId?: string;
  status?: 'active' | 'inactive' | 'all';
}

// =============================================================================
// COMPANY TYPES
// =============================================================================

export interface CompanyDTO {
  id: string;
  name: string;
  code: string;
  address?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCompanyDTO {
  name: string;
  code: string;
  address?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export interface UpdateCompanyDTO {
  name?: string;
  code?: string;
  address?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export interface CompanyFormData {
  name: string;
  code: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  isActive: boolean;
}

export interface CompanyFilters {
  name?: string;
  code?: string;
  contactPerson?: string;
  status?: 'active' | 'inactive' | 'all';
}

// =============================================================================
// INSPECTION CHECKLIST TYPES
// =============================================================================

export interface InspectionChecklistDTO {
  id: string;
  parentId: string | null;
  name: string;
  code?: string | null;
  description?: string | null;
  order: number;
  isActive: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  parent?: InspectionChecklistDTO | null;
  children?: InspectionChecklistDTO[];
}

export interface CreateInspectionChecklistDTO {
  name: string;
  parentId?: string;
  code?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export type UpdateInspectionChecklistDTO = Partial<CreateInspectionChecklistDTO>;

export interface InspectionChecklistSearchParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  isActive?: boolean;
  rootsOnly?: boolean;
  options?: boolean;
}

// =============================================================================
// HFACS NODE TYPES (Investigation Sections H & I cause catalogue)
// =============================================================================

export type HfacsSection = 'LATENT_FAILURE' | 'ACTIVE_FAILURE';

export interface HfacsNodeDTO {
  id: string;
  parentId: string | null;
  section: HfacsSection;
  depth: number; // 0 = Tier1, 1 = Tier2, 2 = Item
  code?: string | null;
  labelEn: string;
  labelId: string;
  isOther: boolean;
  order: number;
  isActive: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  parent?: HfacsNodeDTO | null;
  children?: HfacsNodeDTO[];
}

export interface CreateHfacsNodeDTO {
  parentId?: string;
  section: HfacsSection;
  code?: string;
  labelEn: string;
  labelId: string;
  isOther?: boolean;
  order?: number;
  isActive?: boolean;
}

export type UpdateHfacsNodeDTO = Partial<CreateHfacsNodeDTO>;

export interface HfacsNodeSearchParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  section?: HfacsSection;
  depth?: number;
  parentId?: string | null;
  isActive?: boolean;
  options?: boolean;
}
