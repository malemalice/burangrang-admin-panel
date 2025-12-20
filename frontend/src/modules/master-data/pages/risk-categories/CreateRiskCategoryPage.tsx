import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import RiskCategoryForm from './RiskCategoryForm';

const CreateRiskCategoryPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Create Risk Category"
        subtitle="Add a new risk category to the system"
        actions={
          <Button variant="outline" onClick={() => navigate('/master/risk-categories')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Risk Categories
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <RiskCategoryForm mode="create" />
      </div>
    </>
  );
};

export default CreateRiskCategoryPage;
