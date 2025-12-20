import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import RiskMatrixForm from './RiskMatrixForm';

const CreateRiskMatrixPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Create Risk Matrix Entry"
        subtitle="Add a new risk matrix entry combining likelihood and consequence levels"
        actions={
          <Button variant="outline" onClick={() => navigate('/risk-matrix')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Risk Matrix
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <RiskMatrixForm mode="create" />
      </div>
    </>
  );
};

export default CreateRiskMatrixPage;
