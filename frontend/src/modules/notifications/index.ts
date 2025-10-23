/**
 * Notifications module barrel exports
 * Following the TRD.md module structure template
 */

// Pages
export { default as NotificationsPage } from './pages/NotificationsPage';

// Routes
export { default as notificationRoutes } from './routes/notificationRoutes';

// Services
export { default as notificationService } from './services/notificationService';

// Types
export type {
  // Core entity types
  Notification,
  NotificationDTO,
  NotificationType,
  NotificationTypeDTO,
  NotificationRecipient,
  NotificationRecipientDTO,

  // Form and UI types
  NotificationFormData,
  NotificationFilters,
  NotificationSearchParams,

  // Statistics and analytics
  NotificationStats,

  // Common shared types
  PaginatedResponse,
  PaginationParams,
} from './types/notification.types';

// Hooks
export {
  useNotifications,
  useNotification,
  useNotificationTypes,
  useUnreadCount,
} from './hooks/useNotifications';

// Components
export { default as NotificationDropdown } from './components/NotificationDropdown';
export { default as NotificationItem } from './components/NotificationItem';
export { default as NotificationList } from './components/NotificationList';
