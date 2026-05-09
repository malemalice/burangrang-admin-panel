import { RouteConfig } from './types';
import coreRoutes from './modules/coreRoutes';
import moduleRoutes from './modules/moduleRoutes';
import { settingsRoutes } from '@/modules/settings';
import { userRoutes } from '@/modules/users';
import { roleRoutes } from '@/modules/roles';
import { masterDataRoutes } from '@/modules/master-data';
import { menuRoutes } from '@/modules/menus';
import { notificationRoutes } from '@/modules/notifications';
import { emailTemplateRoutes } from '@/modules/mail-templates';
import { accessLogRoutes } from '@/modules/access-logs';
import { reminderRoutes } from '@/modules/reminders';

const routes: RouteConfig[] = [
  ...coreRoutes.filter(route => route.path !== '/login' && route.path !== '*'),
  ...userRoutes,
  ...roleRoutes,
  ...menuRoutes,
  ...masterDataRoutes,
  ...settingsRoutes,
  ...notificationRoutes,
  ...emailTemplateRoutes,
  ...accessLogRoutes,
  ...reminderRoutes,
  ...moduleRoutes,
];

export const publicRoutes: RouteConfig[] = [
  coreRoutes.find(route => route.path === '/login')!,
  coreRoutes.find(route => route.path === '/reset-password')!,
];

export const notFoundRoute: RouteConfig = coreRoutes.find(route => route.path === '*')!;

export default routes; 