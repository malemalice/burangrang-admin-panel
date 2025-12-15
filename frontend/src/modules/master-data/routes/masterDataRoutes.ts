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
  HseCategoriesPage,
  CreateHseCategoryPage,
  EditHseCategoryPage,
  HseCategoryDetailPage,
  ThreatsPage,
  CreateThreatPage,
  EditThreatPage,
  ThreatDetailPage,
  ThreatMitigationsPage,
  CreateThreatMitigationPage,
  EditThreatMitigationPage,
  MasterApprovalsPage,
  CreateMasterApprovalPage,
  EditMasterApprovalPage,
  RoomsPage,
  CreateRoomPage,
  EditRoomPage,
  AreasPage,
  CreateAreaPage,
  EditAreaPage,
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
    path: '/master/hse-categories',
    component: HseCategoriesPage,
  },
  {
    path: '/master/hse-categories/new',
    component: CreateHseCategoryPage,
  },
  {
    path: '/master/hse-categories/:id',
    component: HseCategoryDetailPage,
  },
  {
    path: '/master/hse-categories/:id/edit',
    component: EditHseCategoryPage,
  },
  {
    path: '/master/threats',
    component: ThreatsPage,
  },
  {
    path: '/master/threats/new',
    component: CreateThreatPage,
  },
  {
    path: '/master/threats/:id',
    component: ThreatDetailPage,
  },
  {
    path: '/master/threats/:id/edit',
    component: EditThreatPage,
  },
  {
    path: '/master/threat-mitigations',
    component: ThreatMitigationsPage,
  },
  {
    path: '/master/threat-mitigations/new',
    component: CreateThreatMitigationPage,
  },
  {
    path: '/master/threat-mitigations/:id',
    component: EditThreatMitigationPage,
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
  {
    path: '/master/areas',
    component: AreasPage,
  },
  {
    path: '/master/areas/create',
    component: CreateAreaPage,
  },
  {
    path: '/master/areas/:id/edit',
    component: EditAreaPage,
  },
  {
    path: '/master/rooms',
    component: RoomsPage,
  },
  {
    path: '/master/rooms/new',
    component: CreateRoomPage,
  },
  {
    path: '/master/rooms/:id/edit',
    component: EditRoomPage,
  },
];

export default masterDataRoutes; 