import { RouteConfig } from '@/core/routes/types';
import { lazy } from 'react';

const HealthScreeningsPage = lazy(() => import('../pages/HealthScreeningsPage'));
const HealthScreeningFillPage = lazy(() => import('../pages/HealthScreeningFillPage'));
const HealthScreeningDetailPage = lazy(() => import('../pages/HealthScreeningDetailPage'));

const healthScreeningRoutes: RouteConfig[] = [
  { path: '/health-screenings', component: HealthScreeningsPage },
  { path: '/health-screenings/:id/fill', component: HealthScreeningFillPage },
  { path: '/health-screenings/:id', component: HealthScreeningDetailPage },
];

export default healthScreeningRoutes;
