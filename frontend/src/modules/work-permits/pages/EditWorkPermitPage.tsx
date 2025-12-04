import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import WorkPermitForm from '../components/WorkPermitForm';
import { UpdateWorkPermitDTO } from '../types/work-permit.types';
import { useWorkPermit, useWorkPermits } from '../hooks/useWorkPermits';

const EditWorkPermitPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { workPermit, isLoading, fetchWorkPermit } = useWorkPermit(id || null);
  const { updateWorkPermit } = useWorkPermits();

  useEffect(() => {
    if (id) {
      fetchWorkPermit(id);
    }
  }, [id]);

  const handleSubmit = async (data: UpdateWorkPermitDTO) => {
    if (!id) return;
    try {
      const updated = await updateWorkPermit(id, data);
      navigate(`/work-permits/${updated.id}`);
    } catch (error) {
      // Error handled in hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!workPermit) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Work permit not found</p>
          <Button onClick={() => navigate('/work-permits')} className="mt-4">
            Back to Work Permits
          </Button>
        </div>
      </div>
    );
  }

  // Check if can edit
  if (workPermit.status !== 'DRAFT' && workPermit.status !== 'NEED_INFO') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">
            This work permit cannot be edited. Only DRAFT or NEED_INFO permits can be edited.
          </p>
          <Button onClick={() => navigate(`/work-permits/${workPermit.id}`)} className="mt-4">
            View Details
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Edit Work Permit"
        subtitle={`Editing: ${workPermit.code}`}
        actions={
          <Button variant="outline" onClick={() => navigate(`/work-permits/${workPermit.id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />
      <WorkPermitForm onSubmit={handleSubmit} mode="edit" workPermit={workPermit} />
    </div>
  );
};

export default EditWorkPermitPage;
