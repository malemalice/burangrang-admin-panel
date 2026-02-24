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
  RiskCategoriesPage,
  CreateRiskCategoryPage,
  EditRiskCategoryPage,
  RiskCategoryDetailPage,
  RisksPage,
  CreateRiskPage,
  EditRiskPage,
  RiskDetailPage,
  RiskMitigationsPage,
  CreateRiskMitigationPage,
  EditRiskMitigationPage,
  ViewRiskMitigationPage,
  MasterApprovalsPage,
  CreateMasterApprovalPage,
  EditMasterApprovalPage,
  MasterApprovalDetailPage,
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
    path: '/master/risk-categories',
    component: RiskCategoriesPage,
  },
  {
    path: '/master/risk-categories/new',
    component: CreateRiskCategoryPage,
  },
  {
    path: '/master/risk-categories/:id',
    component: RiskCategoryDetailPage,
  },
  {
    path: '/master/risk-categories/:id/edit',
    component: EditRiskCategoryPage,
  },
  {
    path: '/master/risks',
    component: RisksPage,
  },
  {
    path: '/master/risks/new',
    component: CreateRiskPage,
  },
  {
    path: '/master/risks/:id',
    component: RiskDetailPage,
  },
  {
    path: '/master/risks/:id/edit',
    component: EditRiskPage,
  },
  {
    path: '/master/risk-mitigations',
    component: RiskMitigationsPage,
  },
  {
    path: '/master/risk-mitigations/new',
    component: CreateRiskMitigationPage,
  },
  {
    path: '/master/risk-mitigations/:id/edit',
    component: EditRiskMitigationPage,
  },
  {
    path: '/master/risk-mitigations/:id',
    component: ViewRiskMitigationPage,
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
    path: '/master/approvals/:id',
    component: MasterApprovalDetailPage,
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