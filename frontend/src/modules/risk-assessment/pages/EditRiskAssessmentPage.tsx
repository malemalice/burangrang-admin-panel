import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import RiskAssessmentForm from '../components/RiskAssessmentForm';
import riskAssessmentService from '../services/riskAssessmentService';
import { RiskAssessment } from '@/core/lib/types';

const EditRiskAssessmentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        if (!id) return;
        const data = await riskAssessmentService.getById(id);
        setAssessment(data);
      } catch (error) {
        toast.error('Failed to fetch risk assessment');
        navigate('/risk-assessment');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssessment();
  }, [id, navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!assessment) {
    return null;
  }

  return <RiskAssessmentForm assessment={assessment} mode="edit" />;
};

export default EditRiskAssessmentPage;

