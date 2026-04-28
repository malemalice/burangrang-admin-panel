import { lazy } from 'react';
import { RouteConfig } from '@/core/routes/types';

const NotificationsPage = lazy(() => import('../pages/NotificationsPage'));

const notificationRoutes: RouteConfig[] = [
  {
    path: '/notifications',
    component: NotificationsPage,
  },
];

export default notificationRoutes;
