import { RouteConfig } from '@/core/routes/types';
import RiskRegisterPage from '../pages/RiskRegisterPage';
import ViewRiskRegisterPage from '../pages/ViewRiskRegisterPage';

/**
 * Risk Register module routes
 */
const riskRegisterRoutes: RouteConfig[] = [
  {
    path: '/risk-register',
    component: RiskRegisterPage,
  },
  {
    path: '/risk-register/:id',
    component: ViewRiskRegisterPage,
  },
];

export default riskRegisterRoutes;
