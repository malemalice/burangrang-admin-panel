import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Badge } from '@/core/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { RefreshCw, Search, Check } from 'lucide-react';
import { useNotifications, useNotificationTypes, useUnreadCount } from '../hooks/useNotifications';
import NotificationList from '../components/NotificationList';
import { NotificationSearchParams, NotificationFilters } from '../types/notification.types';
import PageHeader from '@/core/components/ui/PageHeader';

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    totalNotifications,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const { notificationTypes } = useNotificationTypes();
  const { unreadCount } = useUnreadCount();

  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [activeTab, setActiveTab] = useState('all');

  // Load notifications when dependencies change
  useEffect(() => {
    const searchParams: NotificationSearchParams = {
      page: pageIndex + 1,
      limit,
      search: search || undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      filters: {
        ...filters,
        isRead: activeTab === 'unread' ? false : activeTab === 'read' ? true : undefined,
      },
    };

    fetchNotifications(searchParams);
  }, [fetchNotifications, pageIndex, limit, search, filters, activeTab]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPageIndex(0); // Reset to first page when searching
  };

  const handleFilterChange = (key: keyof NotificationFilters, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
    setPageIndex(0); // Reset to first page when filtering
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPageIndex(0); // Reset to first page when changing tabs
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleRefresh = () => {
    const searchParams: NotificationSearchParams = {
      page: pageIndex + 1,
      limit,
      search: search || undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      filters: {
        ...filters,
        isRead: activeTab === 'unread' ? false : activeTab === 'read' ? true : undefined,
      },
    };

    fetchNotifications(searchParams);
  };

  // Calculate read count from total notifications minus unread count
  const readCount = totalNotifications - unreadCount;

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Manage your notifications and stay updated with system activities"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
              >
                <Check className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw size={18} /> Total Notifications
            </CardTitle>
            <CardDescription>All notifications in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{totalNotifications}</span>
              <Badge variant="outline">{totalNotifications}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Check size={18} /> Unread Notifications
            </CardTitle>
            <CardDescription>Notifications that need attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-red-600">{unreadCount}</span>
              <Badge variant="destructive">{unreadCount}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Check size={18} /> Read Notifications
            </CardTitle>
            <CardDescription>Notifications you've already seen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-green-600">{readCount}</span>
              <Badge variant="secondary">{readCount}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search notifications..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Context</label>
              <Select
                value={filters.context || undefined}
                onValueChange={(value) => handleFilterChange('context', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All contexts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All contexts</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="roles">Roles</SelectItem>
                  <SelectItem value="offices">Offices</SelectItem>
                  <SelectItem value="departments">Departments</SelectItem>
                  <SelectItem value="job_positions">Job Positions</SelectItem>
                  <SelectItem value="menus">Menus</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                  <SelectItem value="approvals">Approvals</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select
                value={filters.typeId || undefined}
                onValueChange={(value) => handleFilterChange('typeId', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {notificationTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            All ({totalNotifications})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="read">
            Read ({readCount})
          </TabsTrigger>
        </TabsList>
        
        <Card>
          <CardContent className="pt-6">
            <NotificationList
              notifications={notifications}
              isLoading={isLoading}
              onMarkAsRead={handleMarkAsRead}
              onRefresh={handleRefresh}
              showActions={true}
              emptyMessage={
                activeTab === 'unread' 
                  ? 'No unread notifications' 
                  : activeTab === 'read'
                  ? 'No read notifications'
                  : 'No notifications found'
              }
            />
          </CardContent>
        </Card>
      </Tabs>
    </>
  );
};

export default NotificationsPage;
