import { RouteConfig } from '@/core/routes/types';
import NotificationsPage from '../pages/NotificationsPage';

const notificationRoutes: RouteConfig[] = [
  {
    path: 'notifications',
    component: NotificationsPage,
  },
];

export default notificationRoutes;
