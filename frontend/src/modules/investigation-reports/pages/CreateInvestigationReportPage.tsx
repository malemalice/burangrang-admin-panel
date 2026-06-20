import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import incidentsService from '@/modules/incidents/services/incidentsService';
import type { Incident } from '@/modules/incidents/types/incident.types';
import investigationReportsService from '../services/investigationReportsService';
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
    const load = async () => {
      try {
        const data = await incidentsService.getById(incidentId);
        if (!data.needFurtherInvestigation) {
          toast.error('This incident is not flagged for further investigation');
          navigate(`/incidents/${incidentId}`);
          return;
        }
        // Smart redirect: if a report already exists for this incident, go to edit
        try {
          const existing = await investigationReportsService.getByIncidentId(incidentId);
          if (existing) {
            navigate(`/investigation-reports/${existing.id}/edit`, { replace: true });
            return;
          }
        } catch (err: any) {
          const status = err?.response?.status;
          if (status === 409 || status === 403) {
            // Report exists but user can't access it — navigate to incident detail
            toast.error('An investigation report already exists for this incident');
            navigate(`/incidents/${incidentId}`, { replace: true });
            return;
          }
          // Any other error (network, 500): proceed optimistically and let the save fail gracefully
        }
        setIncident(data);
      } catch {
        toast.error('Failed to load incident');
        navigate('/incidents');
      } finally {
        setIsLoading(false);
      }
    };
    load();
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
