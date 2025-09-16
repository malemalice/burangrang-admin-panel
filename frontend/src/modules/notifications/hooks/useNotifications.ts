import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import notificationService from '../services/notificationService';
import { 
  Notification, 
  PaginatedResponse, 
  NotificationSearchParams, 
  NotificationFormData, 
  NotificationType 
} from '../types/notification.types';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (params: NotificationSearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<Notification> = await notificationService.getNotifications(params);
      setNotifications(response.data);
      setTotalNotifications(response.meta.total);
      setCurrentPage(params.page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createNotification = useCallback(async (notificationData: NotificationFormData) => {
    try {
      const newNotification = await notificationService.createNotification(notificationData);
      setNotifications(prev => [newNotification, ...prev]);
      setTotalNotifications(prev => prev + 1);
      toast.success('Notification created successfully');
      return newNotification;
    } catch (err) {
      toast.error('Failed to create notification');
      throw err;
    }
  }, []);

  const updateNotification = useCallback(async (id: string, notificationData: Partial<NotificationFormData>) => {
    try {
      const updatedNotification = await notificationService.updateNotification(id, notificationData);
      setNotifications(prev => prev.map(item => item.id === id ? updatedNotification : item));
      toast.success('Notification updated successfully');
      return updatedNotification;
    } catch (err) {
      toast.error('Failed to update notification');
      throw err;
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(item => item.id !== id));
      setTotalNotifications(prev => prev - 1);
      toast.success('Notification deleted successfully');
    } catch (err) {
      toast.error('Failed to delete notification');
      throw err;
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
      );
    } catch (err) {
      toast.error('Failed to mark notification as read');
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all notifications as read');
      throw err;
    }
  }, []);

  return {
    notifications,
    totalNotifications,
    currentPage,
    isLoading,
    error,
    fetchNotifications,
    createNotification,
    updateNotification,
    deleteNotification,
    markAsRead,
    markAllAsRead,
  };
};

export const useNotification = (id: string | null = null) => {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotification = useCallback(async (notificationId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await notificationService.getNotificationById(notificationId);
      setNotification(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notification';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchNotification(id);
    }
  }, [id, fetchNotification]);

  return {
    notification,
    isLoading,
    error,
    fetchNotification,
    setNotification,
  };
};

export const useNotificationTypes = () => {
  const [notificationTypes, setNotificationTypes] = useState<NotificationType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotificationTypes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await notificationService.getNotificationTypes();
      setNotificationTypes(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notification types';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotificationTypes();
  }, [fetchNotificationTypes]);

  return {
    notificationTypes,
    isLoading,
    error,
    fetchNotificationTypes,
  };
};

export const useUnreadCount = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch unread count';
      setError(errorMessage);
      console.error('Failed to fetch unread count:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    isLoading,
    error,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  };
};
