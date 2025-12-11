import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import OfficeForm from './OfficeForm';

const CreateOfficePage = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Create Office"
        subtitle="Add a new office to the system"
        actions={
          <Button variant="outline" onClick={() => navigate('/master/offices')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Offices
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <OfficeForm mode="create" />
      </div>
    </>
  );
};

export default CreateOfficePage; 