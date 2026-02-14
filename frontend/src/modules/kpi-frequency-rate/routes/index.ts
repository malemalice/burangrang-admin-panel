import { lazy } from 'react';
import { RouteConfig } from '@/core/routes/types';

const KpiFrequencyRatePage = lazy(() => import('../pages/KpiFrequencyRatePage'));

export const kpiFrequencyRateRoutes: RouteConfig[] = [
  {
    path: '/dashboard/kpi-frequency-rate',
    component: KpiFrequencyRatePage,
  },
];

export default kpiFrequencyRateRoutes;
