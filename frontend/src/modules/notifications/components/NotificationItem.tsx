import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { Notification } from '../types/notification.types';
import { cn } from '@/core/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onMarkAsUnread?: (id: string) => void;
  showActions?: boolean;
  className?: string;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onMarkAsUnread,
  showActions = false,
  className,
}) => {
  const handleMarkAsRead = () => {
    if (onMarkAsRead && !notification.isRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleMarkAsUnread = () => {
    if (onMarkAsUnread && notification.isRead) {
      onMarkAsUnread(notification.id);
    }
  };

  const getContextBadgeColor = (context?: string) => {
    const colors: Record<string, string> = {
      users: 'bg-blue-100 text-blue-800',
      roles: 'bg-purple-100 text-purple-800',
      offices: 'bg-green-100 text-green-800',
      departments: 'bg-orange-100 text-orange-800',
      job_positions: 'bg-pink-100 text-pink-800',
      menus: 'bg-indigo-100 text-indigo-800',
      settings: 'bg-gray-100 text-gray-800',
      approvals: 'bg-yellow-100 text-yellow-800',
      system: 'bg-red-100 text-red-800',
    };
    return colors[context || 'system'] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (typeName?: string) => {
    const icons: Record<string, string> = {
      user_activity: '👤',
      role_activity: '🔐',
      office_activity: '🏢',
      department_activity: '🏛️',
      job_position_activity: '💼',
      menu_activity: '📋',
      settings_activity: '⚙️',
      approval_activity: '✅',
      system_activity: '🔔',
      general_activity: '📢',
    };
    return icons[typeName || 'general_activity'] || '📢';
  };

  return (
    <div
      className={cn(
        'px-4 py-3 hover:bg-slate-50 dark:hover:bg-gray-700 border-b dark:border-gray-700 border-slate-200 last:border-0 cursor-pointer transition-colors',
        !notification.isRead && 'bg-blue-50 dark:bg-blue-900/20',
        className
      )}
      onClick={handleMarkAsRead}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">
              {getTypeIcon(notification.type?.name)}
            </span>
            <h4 className={cn(
              'text-sm font-medium dark:text-white truncate',
              !notification.isRead && 'font-semibold'
            )}>
              {notification.title}
            </h4>
            {!notification.isRead && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
            )}
          </div>
          
          <p className="text-sm text-slate-600 dark:text-gray-300 mb-2 line-clamp-2">
            {notification.message}
          </p>
          
          <div className="flex items-center gap-2 flex-wrap">
            {notification.context && (
              <Badge 
                variant="outline" 
                className={cn(
                  'text-xs border-0',
                  getContextBadgeColor(notification.context)
                )}
              >
                {notification.context}
              </Badge>
            )}
            
            <span className="text-xs text-slate-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        {showActions && (
          <div className="flex items-center gap-1">
            {notification.isRead ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkAsUnread();
                }}
                className="h-6 w-6 p-0"
              >
                <EyeOff className="h-3 w-3" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkAsRead();
                }}
                className="h-6 w-6 p-0"
              >
                <Eye className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationItem;
