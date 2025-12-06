import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import WorkPermitForm from '../components/WorkPermitForm';
import { CreateWorkPermitDTO } from '../types/work-permit.types';
import { useWorkPermits } from '../hooks/useWorkPermits';

const CreateWorkPermitPage = () => {
  const navigate = useNavigate();
  const { createWorkPermit } = useWorkPermits();

  const handleSubmit = async (data: CreateWorkPermitDTO) => {
    try {
      const workPermit = await createWorkPermit(data);
      navigate(`/work-permits/${workPermit.id}`);
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <div>
      <PageHeader
        title="Create Work Permit"
        subtitle="Fill in the work permit information"
        actions={
          <Button variant="outline" onClick={() => navigate('/work-permits')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />
      <WorkPermitForm onSubmit={handleSubmit} mode="create" />
    </div>
  );
};

export default CreateWorkPermitPage;
