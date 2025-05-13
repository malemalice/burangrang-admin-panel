import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import JobPositionForm from './JobPositionForm';
import jobPositionService from '@/services/jobPositionService';
import { JobPosition } from '@/lib/types';

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
    return <div>Loading...</div>;
  }

  if (!jobPosition) {
    return null;
  }

  return <JobPositionForm jobPosition={jobPosition} mode="edit" />;
};

export default EditJobPositionPage; 