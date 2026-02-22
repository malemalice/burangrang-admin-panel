import { RouteConfig } from '@/core/routes/types';
import AccessLogsPage from '../pages/AccessLogsPage';
import AccessLogDetailPage from '../pages/AccessLogDetailPage';

/**
 * Access Logs module routes (Super Admin only via access-log:list / access-log:read).
 */
const accessLogRoutes: RouteConfig[] = [
  {
    path: '/access-logs',
    component: AccessLogsPage,
  },
  {
    path: '/access-logs/:id',
    component: AccessLogDetailPage,
  },
];

export default accessLogRoutes;
