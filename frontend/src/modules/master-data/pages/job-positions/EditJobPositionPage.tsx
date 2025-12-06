import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import JobPositionForm from './JobPositionForm';
import jobPositionService from '../../services/jobPositionService';
import { JobPosition } from '@/core/lib/types';

const EditJobPositionPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [jobPosition, setJobPosition] = useState<JobPosition | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchJobPosition = async () => {
      try {
        if (!id) return;
        const data = await jobPositionService.getById(id);
        setJobPosition(data);
      } catch (error) {
        toast.error('Failed to fetch job position');
        navigate('/master/job-positions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobPosition();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading job position details...</span>
        </div>
      </div>
    );
  }

  if (!jobPosition) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Job Position not found
        </h2>
        <p className="text-gray-600 mb-4">
          The job position you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => navigate('/master/job-positions')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Job Positions
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Job Position"
        subtitle={`Modify the details of "${jobPosition.name}"`}
        actions={
          <Button variant="outline" onClick={() => navigate('/master/job-positions')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Job Positions
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <JobPositionForm jobPosition={jobPosition} mode="edit" />
      </div>
    </>
  );
};

export default EditJobPositionPage; 