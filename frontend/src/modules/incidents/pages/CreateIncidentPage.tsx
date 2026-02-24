import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import IncidentForm from '../components/IncidentForm';

const CreateIncidentPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Create Incident"
        subtitle="Report a new incident"
        actions={
          <Button variant="outline" onClick={() => navigate('/incidents')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Incidents
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <IncidentForm mode="create" />
      </div>
    </>
  );
};

export default CreateIncidentPage;
