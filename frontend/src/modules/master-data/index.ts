/**
 * Master Data module barrel exports
 * Following the TRD.md module structure template
 */

// Pages - Offices
export { default as OfficesPage } from './pages/offices/OfficesPage';
export { default as CreateOfficePage } from './pages/offices/CreateOfficePage';
export { default as EditOfficePage } from './pages/offices/EditOfficePage';
export { default as OfficeDetailPage } from './pages/offices/OfficeDetailPage';
export { default as OfficeForm } from './pages/offices/OfficeForm';

// Pages - Departments
export { default as DepartmentsPage } from './pages/departments/DepartmentsPage';
export { default as CreateDepartmentPage } from './pages/departments/CreateDepartmentPage';
export { default as EditDepartmentPage } from './pages/departments/EditDepartmentPage';
export { default as DepartmentDetailPage } from './pages/departments/DepartmentDetailPage';
export { default as DepartmentForm } from './pages/departments/DepartmentForm';

// Pages - Job Positions
export { default as JobPositionsPage } from './pages/job-positions/JobPositionsPage';
export { default as CreateJobPositionPage } from './pages/job-positions/CreateJobPositionPage';
export { default as EditJobPositionPage } from './pages/job-positions/EditJobPositionPage';
export { default as JobPositionForm } from './pages/job-positions/JobPositionForm';

// Pages - Master Approvals
export { default as MasterApprovalsPage } from './pages/approvals/MasterApprovalsPage';
export { default as CreateMasterApprovalPage } from './pages/approvals/CreateMasterApprovalPage';
export { default as EditMasterApprovalPage } from './pages/approvals/EditMasterApprovalPage';
export { default as MasterApprovalForm } from './pages/approvals/MasterApprovalForm';

// Routes
export { default as masterDataRoutes } from './routes/masterDataRoutes';

// Services
export { default as officeService } from './services/officeService';
export { default as departmentService } from './services/departmentService';
export { default as jobPositionService } from './services/jobPositionService';
export { default as masterApprovalService } from './services/masterApprovalService';

// Types
export type {
  // Core types
  Office,
  Department,
  JobPosition,
  MasterApproval,
  MasterApprovalItem,
  PaginatedResponse,
  PaginationParams,
  
  // DTO types
  OfficeDTO,
  DepartmentDTO,
  JobPositionDTO,
  MasterApprovalDTO,
  MasterApprovalItemDTO,
  
  // Create/Update DTOs
  CreateOfficeDTO,
  UpdateOfficeDTO,
  CreateDepartmentDTO,
  UpdateDepartmentDTO,
  CreateJobPositionDTO,
  UpdateJobPositionDTO,
  CreateMasterApprovalDTO,
  UpdateMasterApprovalDTO,
  
  // Form data types
  OfficeFormData,
  DepartmentFormData,
  JobPositionFormData,
  MasterApprovalFormData,
  
  // Filter and search types
  OfficeFilters,
  DepartmentFilters,
  JobPositionFilters,
  MasterApprovalFilters,
  OfficeSearchParams,
  DepartmentSearchParams,
  JobPositionSearchParams,
  MasterApprovalSearchParams,
  
  // Statistics
  MasterDataStats,
} from './types/master-data.types';

// Hooks
export { 
  useOffices, 
  useDepartments, 
  useJobPositions, 
  useMasterApprovals,
  useMasterDataStats 
} from './hooks/useMasterData';
