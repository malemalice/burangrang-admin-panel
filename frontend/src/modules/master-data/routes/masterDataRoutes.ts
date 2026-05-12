import { lazy } from 'react';
import { RouteConfig } from '@/core/routes/types';

const OfficesPage = lazy(() => import('../pages/offices/OfficesPage'));
const CreateOfficePage = lazy(() => import('../pages/offices/CreateOfficePage'));
const OfficeDetailPage = lazy(() => import('../pages/offices/OfficeDetailPage'));
const EditOfficePage = lazy(() => import('../pages/offices/EditOfficePage'));
const DepartmentsPage = lazy(() => import('../pages/departments/DepartmentsPage'));
const CreateDepartmentPage = lazy(() => import('../pages/departments/CreateDepartmentPage'));
const DepartmentDetailPage = lazy(() => import('../pages/departments/DepartmentDetailPage'));
const EditDepartmentPage = lazy(() => import('../pages/departments/EditDepartmentPage'));
const JobPositionsPage = lazy(() => import('../pages/job-positions/JobPositionsPage'));
const CreateJobPositionPage = lazy(() => import('../pages/job-positions/CreateJobPositionPage'));
const EditJobPositionPage = lazy(() => import('../pages/job-positions/EditJobPositionPage'));
const RiskCategoriesPage = lazy(() => import('../pages/risk-categories/RiskCategoriesPage'));
const CreateRiskCategoryPage = lazy(() => import('../pages/risk-categories/CreateRiskCategoryPage'));
const RiskCategoryDetailPage = lazy(() => import('../pages/risk-categories/RiskCategoryDetailPage'));
const EditRiskCategoryPage = lazy(() => import('../pages/risk-categories/EditRiskCategoryPage'));
const RisksPage = lazy(() => import('../pages/risks/RisksPage'));
const CreateRiskPage = lazy(() => import('../pages/risks/CreateRiskPage'));
const RiskDetailPage = lazy(() => import('../pages/risks/RiskDetailPage'));
const EditRiskPage = lazy(() => import('../pages/risks/EditRiskPage'));
const RiskMitigationsPage = lazy(() => import('../pages/risk-mitigations/RiskMitigationsPage'));
const CreateRiskMitigationPage = lazy(() => import('../pages/risk-mitigations/CreateRiskMitigationPage'));
const EditRiskMitigationPage = lazy(() => import('../pages/risk-mitigations/EditRiskMitigationPage'));
const ViewRiskMitigationPage = lazy(() => import('../pages/risk-mitigations/ViewRiskMitigationPage'));
const MasterApprovalsPage = lazy(() => import('../pages/approvals/MasterApprovalsPage'));
const CreateMasterApprovalPage = lazy(() => import('../pages/approvals/CreateMasterApprovalPage'));
const MasterApprovalDetailPage = lazy(() => import('../pages/approvals/MasterApprovalDetailPage'));
const EditMasterApprovalPage = lazy(() => import('../pages/approvals/EditMasterApprovalPage'));
const RoomsPage = lazy(() => import('../pages/rooms/RoomsPage'));
const CreateRoomPage = lazy(() => import('../pages/rooms/CreateRoomPage'));
const EditRoomPage = lazy(() => import('../pages/rooms/EditRoomPage'));
const AreasPage = lazy(() => import('../pages/areas/AreasPage'));
const CreateAreaPage = lazy(() => import('../pages/areas/CreateAreaPage'));
const EditAreaPage = lazy(() => import('../pages/areas/EditAreaPage'));
const CompaniesPage = lazy(() => import('../pages/companies/CompaniesPage'));
const CreateCompanyPage = lazy(() => import('../pages/companies/CreateCompanyPage'));
const EditCompanyPage = lazy(() => import('../pages/companies/EditCompanyPage'));
const InspectionChecklistsPage = lazy(() => import('../pages/inspection-checklists/InspectionChecklistsPage'));
const HfacsNodesPage = lazy(() => import('../pages/hfacs-nodes/HfacsNodesPage'));

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
    path: '/master/companies',
    component: CompaniesPage,
  },
  {
    path: '/master/companies/create',
    component: CreateCompanyPage,
  },
  {
    path: '/master/companies/:id/edit',
    component: EditCompanyPage,
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
  {
    path: '/master/inspection-checklists',
    component: InspectionChecklistsPage,
  },
  {
    path: '/master/hfacs-nodes',
    component: HfacsNodesPage,
  },
];

export default masterDataRoutes;
