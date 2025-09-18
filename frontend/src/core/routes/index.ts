import { RouteConfig } from './types';
import coreRoutes from './modules/coreRoutes';
import { settingsRoutes } from '@/modules/settings';
import { userRoutes } from '@/modules/users';
import { roleRoutes } from '@/modules/roles';
import { masterDataRoutes } from '@/modules/master-data';
import { menuRoutes } from '@/modules/menus';
import { notificationRoutes } from '@/modules/notifications';
import { categoryRoutes } from '@/modules/categories';

/**
 * Application routes registry
 * All routes from different modules are registered here
 */
const routes: RouteConfig[] = [
  ...coreRoutes.filter(route => route.path !== '/login' && route.path !== '*'),
  ...userRoutes,
  ...roleRoutes,
  ...menuRoutes,
  ...masterDataRoutes,
  ...settingsRoutes,
  ...notificationRoutes,
  ...categoryRoutes,
];

// Public routes that don't require authentication
export const publicRoutes: RouteConfig[] = [
  coreRoutes.find(route => route.path === '/login')!,
];

// Not Found route
export const notFoundRoute: RouteConfig = coreRoutes.find(route => route.path === '*')!;

export default routes; 