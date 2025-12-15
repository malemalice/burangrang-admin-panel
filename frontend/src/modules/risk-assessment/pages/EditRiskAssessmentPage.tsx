import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading risk assessment details...</span>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Risk Assessment not found
        </h2>
        <p className="text-gray-600 mb-4">
          The risk assessment you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => navigate('/risk-assessment')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Risk Assessments
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Risk Assessment"
        subtitle={`Modify the details of "${assessment.title || assessment.id}"`}
        actions={
          <Button variant="outline" onClick={() => navigate('/risk-assessment')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Risk Assessments
          </Button>
        }
      />
      <div className="max-w-7xl mx-auto">
        <RiskAssessmentForm assessment={assessment} mode="edit" />
      </div>
    </>
  );
};

export default EditRiskAssessmentPage;

