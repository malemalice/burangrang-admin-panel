import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!reminder) {
    return null;
  }

  return <ReminderForm reminder={reminder} mode="edit" />;
};

export default EditReminderPage;

