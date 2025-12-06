import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import ThreatForm from './ThreatForm';

const CreateThreatPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Create Threat"
        subtitle="Add a new threat to the system"
        actions={
          <Button variant="outline" onClick={() => navigate('/master/threats')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Threats
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <ThreatForm mode="create" />
      </div>
    </>
  );
};

export default CreateThreatPage; 