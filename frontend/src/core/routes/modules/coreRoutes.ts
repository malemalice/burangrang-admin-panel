import { RouteConfig } from '../types';
import Dashboard from '@/core/pages/Dashboard';
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
    path: '/login',
    component: Login,
  },
  {
    path: '*',
    component: NotFound,
  },
];

export default coreRoutes; 