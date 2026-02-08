import { lazy } from 'react';
import { RouteConfig } from '@/core/routes/types';

const AdminOverviewPage = lazy(() => import('../pages/AdminOverviewPage'));

export const adminOverviewRoutes: RouteConfig[] = [
  {
    path: '/dashboard/admin-overview',
    component: AdminOverviewPage,
  },
];

export default adminOverviewRoutes;
