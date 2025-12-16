import { RouteConfig } from '@/core/routes/types';
import { RiskMatrixManagementPage, RiskMatricesPage, CreateRiskMatrixPage, EditRiskMatrixPage } from '../pages';

/**
 * Risk Matrix module routes
 */
const riskMatrixRoutes: RouteConfig[] = [
  {
    path: '/risk-matrix',
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
