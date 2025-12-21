import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import RiskForm from './RiskForm';

const CreateRiskPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Create Risk"
        subtitle="Add a new risk to the system"
        actions={
          <Button variant="outline" onClick={() => navigate('/master/risks')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Risks
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <RiskForm mode="create" />
      </div>
    </>
  );
};

export default CreateRiskPage;
