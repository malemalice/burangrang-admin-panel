import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import ReminderForm from './ReminderForm';

const CreateReminderPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Create Reminder"
        subtitle="Add a new reminder to the system"
        actions={
          <Button variant="outline" onClick={() => navigate('/reminders')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Reminders
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <ReminderForm mode="create" />
      </div>
    </>
  );
};

export default CreateReminderPage;

