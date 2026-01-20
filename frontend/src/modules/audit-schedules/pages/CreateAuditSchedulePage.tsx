import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import AuditScheduleForm from '../components/AuditScheduleForm';

const CreateAuditSchedulePage = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Create Audit Schedule"
        subtitle="Add a new audit schedule to the system"
        actions={
          <Button variant="outline" onClick={() => navigate('/audit-schedules')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Audit Schedules
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <AuditScheduleForm mode="create" />
      </div>
    </>
  );
};

export default CreateAuditSchedulePage;
