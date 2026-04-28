import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import WorkClassificationForm from './WorkClassificationForm';

const CreateWorkClassificationPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Create work classification"
        subtitle="Define a classification and its safety guidelines for work permits"
        actions={
          <Button variant="outline" onClick={() => navigate('/master/work-classifications')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to list
          </Button>
        }
      />
      <div className="mx-auto max-w-4xl">
        <WorkClassificationForm mode="create" />
      </div>
    </>
  );
};

export default CreateWorkClassificationPage;
