import { lazy } from 'react';
import { RouteConfig } from '@/core/routes/types';

const RemindersPage = lazy(() => import('../pages/RemindersPage'));
const CreateReminderPage = lazy(() => import('../pages/CreateReminderPage'));
const EditReminderPage = lazy(() => import('../pages/EditReminderPage'));
const ReminderDetailPage = lazy(() => import('../pages/ReminderDetailPage'));

/**
 * Reminder management module routes
 */
const reminderRoutes: RouteConfig[] = [
  {
    path: '/reminders',
    component: RemindersPage,
  },
  {
    path: '/reminders/new',
    component: CreateReminderPage,
  },
  {
    path: '/reminders/:reminderId',
    component: ReminderDetailPage,
  },
  {
    path: '/reminders/:reminderId/edit',
    component: EditReminderPage,
  },
];

export default reminderRoutes;
