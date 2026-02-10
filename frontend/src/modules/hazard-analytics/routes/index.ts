import { lazy } from 'react';
import { RouteConfig } from '@/core/routes/types';

const HazardAnalyticsPage = lazy(() => import('../pages/HazardAnalyticsPage'));

export const hazardAnalyticsRoutes: RouteConfig[] = [
  {
    path: '/dashboard/hazard-analytics',
    component: HazardAnalyticsPage,
  },
];

export default hazardAnalyticsRoutes;
