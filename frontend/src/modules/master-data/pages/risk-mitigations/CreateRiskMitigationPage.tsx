import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import RiskMitigationForm from './RiskMitigationForm';

const CreateRiskMitigationPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Create Risk Mitigation"
        subtitle="Add a new risk mitigation to the system"
        actions={
          <Button variant="outline" onClick={() => navigate('/master/risk-mitigations')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Risk Mitigations
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <RiskMitigationForm mode="create" />
      </div>
    </>
  );
};

export default CreateRiskMitigationPage;
