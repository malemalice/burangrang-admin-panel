import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/core/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import { Bell, RefreshCw } from 'lucide-react';
import { useNotifications, useUnreadCount } from '../hooks/useNotifications';
import NotificationList from './NotificationList';
import { cn } from '@/core/lib/utils';

interface NotificationDropdownProps {
  className?: string;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ className }) => {
  const navigate = useNavigate();
  const { notifications, isLoading, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();
  const { unreadCount, markAsRead: markAsReadUnread, markAllAsRead: markAllAsReadUnread } = useUnreadCount();

  // Fetch recent notifications on mount
  useEffect(() => {
    fetchNotifications({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      await markAsReadUnread(id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      await markAllAsReadUnread();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleRefresh = () => {
    fetchNotifications({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  const handleViewAll = () => {
    navigate('/notifications');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "relative h-9 w-9",
            className
          )}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center min-w-[16px]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-2 border-b dark:border-gray-700 border-slate-200">
          <h4 className="font-medium text-sm dark:text-white">Notifications</h4>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs dark:text-gray-300 dark:hover:bg-gray-700 hover:bg-slate-100"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs dark:text-gray-300 dark:hover:bg-gray-700 hover:bg-slate-100"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          <NotificationList
            notifications={notifications}
            isLoading={isLoading}
            onMarkAsRead={handleMarkAsRead}
            onRefresh={handleRefresh}
            emptyMessage="No notifications yet"
          />
        </div>
        
        <div className="p-2 border-t dark:border-gray-700 border-slate-200">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-xs dark:text-gray-300 dark:hover:bg-gray-700 hover:bg-slate-100"
            onClick={handleViewAll}
          >
            View all notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;
