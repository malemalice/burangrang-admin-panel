import { RouteConfig } from '@/core/routes/types';
import SettingsPage from '../pages/SettingsPage';
import SettingsManagementPage from '../pages/SettingsManagementPage';

/**
 * Settings module routes
 */
const settingsRoutes: RouteConfig[] = [
  {
    path: '/settings',
    component: SettingsPage,
  },
  {
    path: '/settings/management',
    component: SettingsManagementPage,
    roles: ['SUPER_ADMIN', 'ADMIN'], // Only admins can access
  },
];

export default settingsRoutes;