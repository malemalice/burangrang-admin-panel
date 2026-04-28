import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import WorkClassificationForm from './WorkClassificationForm';
import workClassificationService from '../services/workClassificationService';
import { WorkClassification } from '../types/work-classification.types';

const EditWorkClassificationPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [classification, setClassification] = useState<WorkClassification | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOne = async () => {
      try {
        if (!id) return;
        const data = await workClassificationService.getWorkClassificationById(id);
        setClassification(data);
      } catch (error: unknown) {
        console.error('Failed to fetch work classification:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch work classification';
        toast.error(errorMessage);
        navigate('/master/work-classifications');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOne();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading…</span>
        </div>
      </div>
    );
  }

  if (!classification) {
    return (
      <div className="py-12 text-center">
        <h2 className="mb-2 text-xl font-semibold">Classification not found</h2>
        <p className="mb-4 text-muted-foreground">
          The item you are looking for does not exist or was removed.
        </p>
        <Button onClick={() => navigate('/master/work-classifications')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to list
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit work classification"
        subtitle={`Update "${classification.name}"`}
        actions={
          <Button variant="outline" onClick={() => navigate('/master/work-classifications')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to list
          </Button>
        }
      />
      <div className="mx-auto max-w-4xl">
        <WorkClassificationForm classification={classification} mode="edit" />
      </div>
    </>
  );
};

export default EditWorkClassificationPage;
