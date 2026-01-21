import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import InspectionForm from '../components/InspectionForm';

const CreateInspectionPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Create Inspection"
        subtitle="Add a new inspection to the system"
        actions={
          <Button variant="outline" onClick={() => navigate('/inspections')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Inspections
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <InspectionForm mode="create" />
      </div>
    </>
  );
};

export default CreateInspectionPage;

