import api from '@/core/lib/api';
import { 
  NotificationDTO, 
  NotificationTypeDTO, 
  Notification, 
  NotificationType, 
  PaginatedResponse, 
  PaginationParams,
  NotificationFormData 
} from '../types/notification.types';

// Data transformation functions
const mapNotificationTypeDtoToNotificationType = (typeDto: NotificationTypeDTO): NotificationType => ({
  id: typeDto.id,
  name: typeDto.name,
  description: typeDto.description,
  isActive: typeDto.isActive,
  createdAt: typeDto.createdAt,
  updatedAt: typeDto.updatedAt,
});

const mapNotificationDtoToNotification = (notificationDto: NotificationDTO): Notification => ({
  id: notificationDto.id,
  title: notificationDto.title,
  message: notificationDto.message,
  context: notificationDto.context,
  contextId: notificationDto.contextId,
  typeId: notificationDto.typeId,
  isRead: notificationDto.isRead,
  isActive: notificationDto.isActive,
  createdAt: notificationDto.createdAt,
  updatedAt: notificationDto.updatedAt,
  readAt: notificationDto.readAt,
  type: notificationDto.type ? mapNotificationTypeDtoToNotificationType(notificationDto.type) : undefined,
  recipients: notificationDto.recipients,
  createdBy: notificationDto.createdBy,
});

const mapNotificationToFormData = (notification: Partial<Notification>): Partial<NotificationFormData> => ({
  title: notification.title,
  message: notification.message,
  context: notification.context,
  contextId: notification.contextId,
  typeId: notification.typeId,
  roleIds: notification.recipients?.map(r => r.roleId) || [],
  userIds: notification.recipients?.map(r => r.userId).filter(Boolean) || [],
});

const notificationService = {
  // GET all notifications with pagination
  getNotifications: async (params: PaginationParams): Promise<PaginatedResponse<Notification>> => {
    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString()
    });

    // Add search and filters
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          // Handle boolean values properly for isRead parameter
          if (key === 'isRead' && typeof value === 'boolean') {
            queryParams.append(key, value.toString());
          } else if (key !== 'isRead') {
            queryParams.append(key, value.toString());
          }
        }
      });
    }

    const response = await api.get(`/notifications?${queryParams.toString()}`);
    return {
      data: response.data.data.map(mapNotificationDtoToNotification),
      meta: response.data.meta
    };
  },

  // GET single notification
  getNotificationById: async (id: string): Promise<Notification> => {
    const response = await api.get(`/notifications/${id}`);
    return mapNotificationDtoToNotification(response.data);
  },

  // GET unread count
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get('/notifications/unread-count');
    return response.data.count;
  },

  // GET notification types
  getNotificationTypes: async (): Promise<NotificationType[]> => {
    const response = await api.get('/notifications/types');
    return response.data.map(mapNotificationTypeDtoToNotificationType);
  },

  // CREATE notification
  createNotification: async (notificationData: NotificationFormData): Promise<Notification> => {
    const response = await api.post('/notifications', notificationData);
    return mapNotificationDtoToNotification(response.data);
  },

  // UPDATE notification
  updateNotification: async (id: string, notificationData: Partial<NotificationFormData>): Promise<Notification> => {
    const response = await api.patch(`/notifications/${id}`, notificationData);
    return mapNotificationDtoToNotification(response.data);
  },

  // MARK as read
  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  // MARK all as read
  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/mark-all-read');
  },

  // DELETE notification
  deleteNotification: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },

  // Utility functions
  mapNotificationDtoToNotification,
  mapNotificationToFormData,
};

export default notificationService;
