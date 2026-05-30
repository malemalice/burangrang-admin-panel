import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import incidentsService from '../services/incidentsService';
import { Incident } from '../types/incident.types';
import IncidentForm from '../components/IncidentForm';

const EditIncidentPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get entryMode from query params
  const modeParam = searchParams.get('mode');
  const entryMode = modeParam && ['creator', 'investigator', 'approver'].includes(modeParam) 
    ? (modeParam as 'creator' | 'investigator' | 'approver')
    : undefined;

  useEffect(() => {
    const fetchIncident = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const data = await incidentsService.getById(id);
        setIncident(data);
      } catch (error) {
        console.error('Failed to fetch incident:', error);
        toast.error('Failed to load incident');
        navigate('/incidents');
      } finally {
        setIsLoading(false);
      }
    };

    fetchIncident();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading incident details...</span>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Incident not found
        </h2>
        <p className="text-muted-foreground mb-4">
          The incident you&apos;re looking for doesn&apos;t exist or has been deleted.
        </p>
        <Button onClick={() => navigate('/incidents')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Incident Reports
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Incident Report"
        subtitle={`Modify the details of "${incident.code}"`}
        actions={
          <Button variant="outline" onClick={() => navigate('/incidents')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Incident Reports
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <IncidentForm incident={incident} mode="edit" entryMode={entryMode} />
      </div>
    </>
  );
};

export default EditIncidentPage;
