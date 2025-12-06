import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import HseCategoryForm from './HseCategoryForm';

const CreateHseCategoryPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Create HSE Category"
        subtitle="Add a new HSE category to the system"
        actions={
          <Button variant="outline" onClick={() => navigate('/master/hse-categories')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to HSE Categories
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <HseCategoryForm mode="create" />
      </div>
    </>
  );
};

export default CreateHseCategoryPage; 