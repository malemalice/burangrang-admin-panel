import React from 'react';
import { Bell, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

// Dummy notification data
const notifications = [
  {
    id: 1,
    type: 'success',
    title: 'Risk Assessment Approved',
    message: 'Your risk assessment for Department A has been approved by John Doe',
    timestamp: new Date(2024, 2, 15, 10, 30),
    read: false,
  },
  {
    id: 2,
    type: 'warning',
    title: 'Compliance Alert',
    message: '3 departments have pending compliance reviews due this week',
    timestamp: new Date(2024, 2, 15, 9, 15),
    read: false,
  },
  {
    id: 3,
    type: 'info',
    title: 'System Update',
    message: 'New HSE categories have been added to the system',
    timestamp: new Date(2024, 2, 14, 16, 45),
    read: true,
  },
  {
    id: 4,
    type: 'warning',
    title: 'High Risk Item',
    message: 'A new high-risk item has been identified in Department B',
    timestamp: new Date(2024, 2, 14, 14, 20),
    read: true,
  },
  {
    id: 5,
    type: 'success',
    title: 'Training Completed',
    message: 'Safety training module has been completed by 15 employees',
    timestamp: new Date(2024, 2, 14, 11, 10),
    read: true,
  },
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'info':
      return <Info className="h-5 w-5 text-blue-500" />;
    default:
      return <Bell className="h-5 w-5 text-gray-500" />;
  }
};

const Notifications = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <Badge variant="secondary" className="text-sm">
          {notifications.filter(n => !n.read).length} unread
        </Badge>
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <Card key={notification.id} className={notification.read ? 'opacity-75' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{notification.title}</h3>
                    <span className="text-sm text-gray-500">
                      {format(notification.timestamp, 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">{notification.message}</p>
                </div>
                {!notification.read && (
                  <Badge variant="default" className="ml-2">
                    New
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Notifications; 