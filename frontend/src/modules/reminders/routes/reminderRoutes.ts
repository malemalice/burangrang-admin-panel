import { RouteConfig } from '@/core/routes/types';
import RemindersPage from '../pages/RemindersPage';
import CreateReminderPage from '../pages/CreateReminderPage';
import EditReminderPage from '../pages/EditReminderPage';
import ReminderDetailPage from '../pages/ReminderDetailPage';

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

