import { lazy } from 'react';
import { RouteConfig } from '@/core/routes/types';

const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const SettingsManagementPage = lazy(() => import('../pages/SettingsManagementPage'));

/**
 * Settings module routes
 */
const settingsRoutes: RouteConfig[] = [
  {
    path: '/settings',
    component: SettingsPage,
  },
  {
    path: '/settings/application',
    component: SettingsManagementPage,
    roles: ['SUPER_ADMIN', 'ADMIN'], // Only admins can access
  },
];

export default settingsRoutes;
