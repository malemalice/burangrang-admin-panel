import { lazy } from 'react';
import { RouteConfig } from '@/core/routes/types';

const RiskMatrixViewPage = lazy(() => import('../pages/RiskMatrixViewPage'));
const RiskMatrixManagementPage = lazy(() => import('../pages/RiskMatrixManagementPage'));
const RiskMatricesPage = lazy(() => import('../pages/RiskMatricesPage'));
const CreateRiskMatrixPage = lazy(() => import('../pages/CreateRiskMatrixPage'));
const EditRiskMatrixPage = lazy(() => import('../pages/EditRiskMatrixPage'));

/**
 * Risk Matrix module routes
 */
const riskMatrixRoutes: RouteConfig[] = [
  {
    path: '/risk-matrix',
    component: RiskMatrixViewPage,
  },
  {
    path: '/risk-matrix/edit',
    component: RiskMatrixManagementPage,
  },
  {
    path: '/risk-matrix/list',
    component: RiskMatricesPage,
  },
  {
    path: '/risk-matrix/new',
    component: CreateRiskMatrixPage,
  },
  {
    path: '/risk-matrix/:id/edit',
    component: EditRiskMatrixPage,
  },
];

export default riskMatrixRoutes;
