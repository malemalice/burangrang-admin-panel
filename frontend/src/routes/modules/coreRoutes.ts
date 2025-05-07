import { RouteConfig } from '../types';
import Dashboard from '@/pages/Dashboard';
import SettingsPage from '@/pages/settings/SettingsPage';
import NotFound from '@/pages/NotFound';
import Login from '@/pages/Login';

/**
 * Core application routes
 */
const coreRoutes: RouteConfig[] = [
  {
    path: '/',
    component: Dashboard,
  },
  {
    path: '/settings',
    component: SettingsPage,
  },
  {
    path: '/login',
    component: Login,
  },
  {
    path: '*',
    component: NotFound,
  },
];

export default coreRoutes; 