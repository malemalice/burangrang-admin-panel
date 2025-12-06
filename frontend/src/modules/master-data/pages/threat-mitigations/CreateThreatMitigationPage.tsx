import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import ThreatMitigationForm from './ThreatMitigationForm';

const CreateThreatMitigationPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Create Threat Mitigation"
        subtitle="Add a new threat mitigation to the system"
        actions={
          <Button variant="outline" onClick={() => navigate('/master/threat-mitigations')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Threat Mitigations
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <ThreatMitigationForm mode="create" />
      </div>
    </>
  );
};

export default CreateThreatMitigationPage; 