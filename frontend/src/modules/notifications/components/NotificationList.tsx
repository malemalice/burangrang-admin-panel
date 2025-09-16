import React from 'react';
import { Notification } from '../types/notification.types';
import NotificationItem from './NotificationItem';
import { Button } from '@/core/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface NotificationListProps {
  notifications: Notification[];
  isLoading?: boolean;
  onMarkAsRead?: (id: string) => void;
  onMarkAsUnread?: (id: string) => void;
  onRefresh?: () => void;
  showActions?: boolean;
  emptyMessage?: string;
  className?: string;
}

const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  isLoading = false,
  onMarkAsRead,
  onMarkAsUnread,
  onRefresh,
  showActions = false,
  emptyMessage = 'No notifications',
  className,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading notifications...
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="text-4xl mb-2">🔔</div>
        <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">
          {emptyMessage}
        </p>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          onMarkAsUnread={onMarkAsUnread}
          showActions={showActions}
        />
      ))}
    </div>
  );
};

export default NotificationList;
