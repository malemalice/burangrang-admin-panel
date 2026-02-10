import { lazy } from 'react';
import { RouteConfig } from '@/core/routes/types';

const SecurityTeamPage = lazy(() => import('../pages/SecurityTeamPage'));

export const securityTeamRoutes: RouteConfig[] = [
  {
    path: '/dashboard/security-team',
    component: SecurityTeamPage,
  },
];

export default securityTeamRoutes;
