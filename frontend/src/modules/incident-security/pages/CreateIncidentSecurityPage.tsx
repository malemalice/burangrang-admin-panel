import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import IncidentSecurityForm from '../components/IncidentSecurityForm';

const CreateIncidentSecurityPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Create Security Incident"
        subtitle="Report a new security incident"
        actions={
          <Button variant="outline" onClick={() => navigate('/incident-securities')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Incident Securities
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <IncidentSecurityForm mode="create" />
      </div>
    </>
  );
};

export default CreateIncidentSecurityPage;
