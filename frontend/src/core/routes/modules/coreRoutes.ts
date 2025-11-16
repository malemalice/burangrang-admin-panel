import { RouteConfig } from '../types';
import Dashboard from '@/core/pages/Dashboard';
import NotFound from '@/core/pages/NotFound';
import Login from '@/core/pages/Login';
import ResetPassword from '@/core/pages/ResetPassword';

/**
 * Core application routes
 */
const coreRoutes: RouteConfig[] = [
  {
    path: '/',
    component: Dashboard,
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