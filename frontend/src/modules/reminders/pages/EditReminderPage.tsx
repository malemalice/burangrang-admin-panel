import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import ReminderForm from './ReminderForm';
import reminderService from '../services/reminderService';
import { Reminder } from '../types/reminder.types';

const EditReminderPage = () => {
  const { reminderId } = useParams<{ reminderId: string }>();
  const navigate = useNavigate();
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReminder = async () => {
      try {
        if (!reminderId) return;
        const data = await reminderService.getReminderById(reminderId);
        setReminder(data);
      } catch (error) {
        toast.error('Failed to fetch reminder');
        navigate('/reminders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReminder();
  }, [reminderId, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading reminder details...</span>
        </div>
      </div>
    );
  }

  if (!reminder) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Reminder not found
        </h2>
        <p className="text-gray-600 mb-4">
          The reminder you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => navigate('/reminders')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Reminders
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Reminder"
        subtitle={`Modify the details of "${reminder.message || reminder.id}"`}
        actions={
          <Button variant="outline" onClick={() => navigate('/reminders')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Reminders
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <ReminderForm reminder={reminder} mode="edit" />
      </div>
    </>
  );
};

export default EditReminderPage;

