import { lazy } from 'react';
import { RouteConfig } from '@/core/routes/types';

const WaterQualityDashboardPage = lazy(
  () => import('../pages/WaterQualityDashboardPage'),
);

export const waterQualityDashboardRoutes: RouteConfig[] = [
  {
    path: '/dashboard/water-quality-lab',
    component: WaterQualityDashboardPage,
  },
];

export default waterQualityDashboardRoutes;
