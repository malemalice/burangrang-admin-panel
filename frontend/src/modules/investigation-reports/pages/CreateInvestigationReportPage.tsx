import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import incidentsService from '@/modules/incidents/services/incidentsService';
import type { Incident } from '@/modules/incidents/types/incident.types';
import InvestigationReportForm from '../components/InvestigationReportForm';

const CreateInvestigationReportPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const incidentId = searchParams.get('incidentId') || '';

  const [incident, setIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!incidentId) {
      toast.error('No incident specified');
      navigate('/incidents');
      return;
    }
    incidentsService
      .getById(incidentId)
      .then((data) => {
        if (!data.needFurtherInvestigation) {
          toast.error('This incident is not flagged for further investigation');
          navigate(`/incidents/${incidentId}`);
          return;
        }
        setIncident(data);
      })
      .catch(() => {
        toast.error('Failed to load incident');
        navigate('/incidents');
      })
      .finally(() => setIsLoading(false));
  }, [incidentId, navigate]);

  if (isLoading || !incident) {
    return <div className="p-8 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Investigation Report"
        subtitle={`For incident ${incident.code} — ${incident.subject}`}
        actions={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />
      <InvestigationReportForm incident={incident} mode="create" />
    </div>
  );
};

export default CreateInvestigationReportPage;
