import { RouteConfig } from '@/core/routes/types';
import {
  OfficesPage,
  CreateOfficePage,
  EditOfficePage,
  OfficeDetailPage,
  DepartmentsPage,
  CreateDepartmentPage,
  DepartmentDetailPage,
  EditDepartmentPage,
  JobPositionsPage,
  CreateJobPositionPage,
  EditJobPositionPage,
  MasterApprovalsPage,
  CreateMasterApprovalPage,
  EditMasterApprovalPage,
} from '../pages';

/**
 * Master data module routes
 */
const masterDataRoutes: RouteConfig[] = [
  {
    path: '/master/offices',
    component: OfficesPage,
  },
  {
    path: '/master/offices/new',
    component: CreateOfficePage,
  },
  {
    path: '/master/offices/:id',
    component: OfficeDetailPage,
  },
  {
    path: '/master/offices/:id/edit',
    component: EditOfficePage,
  },
  {
    path: '/master/departments',
    component: DepartmentsPage,
  },
  {
    path: '/master/departments/new',
    component: CreateDepartmentPage,
  },
  {
    path: '/master/departments/:id',
    component: DepartmentDetailPage,
  },
  {
    path: '/master/departments/:id/edit',
    component: EditDepartmentPage,
  },
  {
    path: '/master/job-positions',
    component: JobPositionsPage,
  },
  {
    path: '/master/job-positions/new',
    component: CreateJobPositionPage,
  },
  {
    path: '/master/job-positions/:id',
    component: EditJobPositionPage,
  },
  {
    path: '/master/approvals',
    component: MasterApprovalsPage,
  },
  {
    path: '/master/approvals/new',
    component: CreateMasterApprovalPage,
  },
  {
    path: '/master/approvals/:id/edit',
    component: EditMasterApprovalPage,
  },
];

export default masterDataRoutes; 