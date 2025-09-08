import { RouteConfig } from '@/core/routes/types';
import SettingsPage from '../pages/SettingsPage';

/**
 * Settings module routes
 */
const settingsRoutes: RouteConfig[] = [
  {
    path: '/settings',
    component: SettingsPage,
  },
];

export default settingsRoutes;