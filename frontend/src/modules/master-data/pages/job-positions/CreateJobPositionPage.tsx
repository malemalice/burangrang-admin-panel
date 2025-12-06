import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import JobPositionForm from './JobPositionForm';

const CreateJobPositionPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Create Job Position"
        subtitle="Add a new job position to the system"
        actions={
          <Button variant="outline" onClick={() => navigate('/master/job-positions')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Job Positions
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <JobPositionForm mode="create" />
      </div>
    </>
  );
};

export default CreateJobPositionPage; 