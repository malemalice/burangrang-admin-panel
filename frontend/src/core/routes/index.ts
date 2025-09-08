import { RouteConfig } from './types';
import userRoutes from './modules/userRoutes';
import roleRoutes from './modules/roleRoutes';
import menuRoutes from './modules/menuRoutes';
import masterRoutes from './modules/masterRoutes';
import coreRoutes from './modules/coreRoutes';
import { settingsRoutes } from '@/modules/settings';

/**
 * Application routes registry
 * All routes from different modules are registered here
 */
const routes: RouteConfig[] = [
  ...coreRoutes.filter(route => route.path !== '/login' && route.path !== '*'),
  ...userRoutes,
  ...roleRoutes,
  ...menuRoutes,
  ...masterRoutes,
  ...settingsRoutes,
];

// Public routes that don't require authentication
export const publicRoutes: RouteConfig[] = [
  coreRoutes.find(route => route.path === '/login')!,
];

// Not Found route
export const notFoundRoute: RouteConfig = coreRoutes.find(route => route.path === '*')!;

export default routes; 