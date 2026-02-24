import { RouteConfig } from '../types';
import Home from '@/core/pages/Home';
import Dashboard from '@/core/pages/Dashboard';
import Profile from '@/core/pages/Profile';
import SettingsPage from '@/modules/settings/pages/SettingsPage';
import NotFound from '@/core/pages/NotFound';
import Login from '@/core/pages/Login';
import ResetPassword from '@/core/pages/ResetPassword';

/**
 * Core application routes
 */
const coreRoutes: RouteConfig[] = [
  {
    path: '/',
    component: Home,
  },
  {
    path: '/dashboard/risk',
    component: Dashboard,
  },
  {
    path: '/profile',
    component: Profile,
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
    path: '/reset-password',
    component: ResetPassword,
  },
  {
    path: '*',
    component: NotFound,
  },
];

export default coreRoutes; 