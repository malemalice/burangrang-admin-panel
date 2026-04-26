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
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          <span>Loading work permit details...</span>
        </div>
      </div>
    );
  }

  if (!workPermit) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Work Permit not found
        </h2>
        <p className="text-gray-600 mb-4">
          The work permit you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => navigate('/work-permits')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Work Permits
        </Button>
      </div>
    );
  }

  // Check if can edit
  if (workPermit.status !== 'DRAFT' && workPermit.status !== 'REJECTED') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">
            This work permit cannot be edited. Only DRAFT or REJECTED permits can be edited.
          </p>
          <Button onClick={() => navigate(`/work-permits/${workPermit.id}`)} className="mt-4">
            View Details
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Work Permit"
        subtitle={`Editing: ${workPermit.code}`}
        actions={
          <Button variant="outline" onClick={() => navigate(`/work-permits/${workPermit.id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Details
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <WorkPermitForm onSubmit={handleSubmit} mode="edit" workPermit={workPermit} />
      </div>
    </>
  );
};

export default EditWorkPermitPage;
