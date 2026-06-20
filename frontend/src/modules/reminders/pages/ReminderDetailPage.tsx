import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Edit, Trash2, Calendar, Clock, Repeat, Bell, FileText } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Label } from '@/core/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/core/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import reminderService from '../services/reminderService';
import { Reminder, ReminderLog, ReminderStatus } from '../types/reminder.types';
import { useReminderLogs } from '../hooks/useReminders';
import { usePermissions } from '@/core/hooks/usePermissions';

const ReminderDetailPage = () => {
  const { reminderId } = useParams<{ reminderId: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { logs, isLoading: logsLoading } = useReminderLogs(reminderId || null);

  useEffect(() => {
    const fetchReminder = async () => {
      if (!reminderId) {
        setError('Reminder ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const reminderData = await reminderService.getReminderById(reminderId);
        setReminder(reminderData);
      } catch (err) {
        console.error('Error fetching reminder:', err);
        setError('Failed to load reminder data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchReminder();
  }, [reminderId]);

  const handleDelete = async () => {
    if (!reminderId) return;

    try {
      setDeleting(true);
      await reminderService.deleteReminder(reminderId);
      toast.success('Reminder deleted successfully');
      navigate('/reminders');
    } catch (err: any) {
      console.error('Error deleting reminder:', err);
      toast.error(err.message || 'Failed to delete reminder');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const getStatusBadgeVariant = (status: ReminderStatus) => {
    switch (status) {
      case ReminderStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case ReminderStatus.SENT:
        return 'bg-green-100 text-green-800';
      case ReminderStatus.EXPIRED:
        return 'bg-gray-100 text-gray-800';
      case ReminderStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800';
      case ReminderStatus.FAILED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (error || !reminder) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Reminder Details</h1>
          <Button variant="outline" onClick={() => navigate('/reminders')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reminders
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">{error || 'Reminder not found'}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reminder Details</h1>
        <div className="space-x-4">
          <Button variant="outline" onClick={() => navigate('/reminders')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reminders
          </Button>
          {hasPermission('reminder:update') && (
            <Button variant="outline" onClick={() => navigate(`/reminders/${reminderId}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Reminder
            </Button>
          )}
          {hasPermission('reminder:delete') && (
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Reminder
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="logs">Execution Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Reminder Information</CardTitle>
              <CardDescription>View reminder details and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Message</Label>
                  <div className="text-base flex items-start gap-2">
                    <Bell className="h-4 w-4 text-gray-500 mt-1" />
                    <div>{reminder.message}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <div>
                    <Badge
                      variant="outline"
                      className={`${getStatusBadgeVariant(reminder.status)} border-0`}
                    >
                      {reminder.status}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Remind At</Label>
                  <div className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    {formatDate(reminder.remindAt)}
                  </div>
                </div>

                {reminder.repeatType && reminder.repeatType !== 'NONE' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-500">Repeat Type</Label>
                      <div className="text-base flex items-center gap-2">
                        <Repeat className="h-4 w-4 text-gray-500" />
                        {reminder.repeatType}
                      </div>
                    </div>

                    {reminder.repeatUntil && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-500">Repeat Until</Label>
                        <div className="text-base flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          {formatDate(reminder.repeatUntil)}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {reminder.lastSentAt && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Last Sent At</Label>
                    <div className="text-base flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      {formatDate(reminder.lastSentAt)}
                    </div>
                  </div>
                )}

                {reminder.entity && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Entity</Label>
                    <div className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      {reminder.entity} {reminder.entityId ? `(${reminder.entityId})` : ''}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Created At</Label>
                  <div className="text-base">{formatDate(reminder.createdAt)}</div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Updated At</Label>
                  <div className="text-base">{formatDate(reminder.updatedAt)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Execution Logs</CardTitle>
              <CardDescription>View reminder execution history</CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex items-center justify-center min-h-[200px]">
                  <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No execution logs found</div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              log.executionStatus === 'SUCCESS' ? 'default' : 'destructive'
                            }
                          >
                            {log.executionStatus}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatDate(log.executedAt)}
                          </span>
                        </div>
                        {log.executionDuration && (
                          <span className="text-sm text-gray-500">
                            {log.executionDuration}ms
                          </span>
                        )}
                      </div>
                      {log.failureReason && (
                        <div className="text-sm text-red-600">
                          <strong>Error:</strong> {log.failureReason}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <span className={log.emailSent ? 'text-green-600' : 'text-red-600'}>
                          Email: {log.emailSent ? 'Sent' : 'Failed'}
                        </span>
                        {log.emailError && (
                          <span className="text-red-600">{log.emailError}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reminder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reminder? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReminderDetailPage;

