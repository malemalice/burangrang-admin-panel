import { lazy } from 'react';
import { RouteConfig } from '@/core/routes/types';

const IncidentProfileAnalyticPage = lazy(() => import('../pages/IncidentProfileAnalyticPage'));

export const incidentProfileAnalyticRoutes: RouteConfig[] = [
  {
    path: '/dashboard/incident-profile-analytic',
    component: IncidentProfileAnalyticPage,
  },
];

export default incidentProfileAnalyticRoutes;
