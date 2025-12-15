import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import RiskAssessmentForm from '../components/RiskAssessmentForm';

const CreateRiskAssessmentPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Create Risk Assessment"
        subtitle="Add a new risk assessment to the system"
        actions={
          <Button variant="outline" onClick={() => navigate('/risk-assessment')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Risk Assessments
          </Button>
        }
      />
      <div className="max-w-7xl mx-auto">
        <RiskAssessmentForm mode="create" />
      </div>
    </>
  );
};
 
export default CreateRiskAssessmentPage;

