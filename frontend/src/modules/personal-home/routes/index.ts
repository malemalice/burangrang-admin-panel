import { lazy } from 'react';
import { RouteConfig } from '@/core/routes/types';

const PersonalHomePage = lazy(() => import('../pages/PersonalHomePage'));

export const personalHomeRoutes: RouteConfig[] = [
  {
    path: '/dashboard/personal-home',
    component: PersonalHomePage,
  },
];

export default personalHomeRoutes;
