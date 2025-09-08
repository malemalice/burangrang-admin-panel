import { RouteConfig } from '../types';
import Dashboard from '@/core/pages/Dashboard';
import SettingsPage from '@/core/pages/SettingsPage';
import NotFound from '@/core/pages/NotFound';
import Login from '@/core/pages/Login';

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