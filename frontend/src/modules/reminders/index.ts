/**
 * Reminders module barrel exports
 * Following the TRD.md module structure template
 */

// Pages
export { default as RemindersPage } from './pages/RemindersPage';
export { default as CreateReminderPage } from './pages/CreateReminderPage';
export { default as EditReminderPage } from './pages/EditReminderPage';
export { default as ReminderDetailPage } from './pages/ReminderDetailPage';
export { default as ReminderForm } from './pages/ReminderForm';

// Routes
export { default as reminderRoutes } from './routes/reminderRoutes';

// Services
export { default as reminderService } from './services/reminderService';

// Types
export type {
  Reminder,
  ReminderDTO,
  CreateReminderDTO,
  UpdateReminderDTO,
  ReminderFormData,
  ReminderFilters,
  ReminderSearchParams,
  ReminderStats,
  ReminderLog,
  PaginatedResponse,
  PaginationParams,
} from './types/reminder.types';

export { ReminderStatus, ReminderRepeatType } from './types/reminder.types';

// Hooks
export { useReminders, useReminder, useReminderLogs, useReminderStats } from './hooks/useReminders';

