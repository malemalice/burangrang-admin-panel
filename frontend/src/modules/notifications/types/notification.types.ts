// Backend DTO interfaces
export interface NotificationTypeDTO {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationRecipientDTO {
  id: string;
  notificationId: string;
  roleId: string;
  userId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationDTO {
  id: string;
  title: string;
  message: string;
  context?: string;
  contextId?: string;
  typeId: string;
  isRead: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  readAt?: string;
  type?: NotificationTypeDTO;
  recipients?: NotificationRecipientDTO[];
  createdBy: string;
}

// Frontend model interfaces
export interface NotificationType {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationRecipient {
  id: string;
  notificationId: string;
  roleId: string;
  userId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  context?: string;
  contextId?: string;
  typeId: string;
  isRead: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  readAt?: string;
  type?: NotificationType;
  recipients?: NotificationRecipient[];
  createdBy: string;
}

// Form and UI types
export interface NotificationFormData {
  title: string;
  message: string;
  context?: string;
  contextId?: string;
  typeId: string;
  roleIds: string[];
  userIds?: string[];
}

export interface NotificationFilters {
  isRead?: boolean;
  context?: string;
  typeId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface NotificationSearchParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: NotificationFilters;
}

// Statistics and analytics
export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  byType: Record<string, number>;
  byContext: Record<string, number>;
  recentActivity: Notification[];
}

// Common shared types (re-exported from core)
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}
