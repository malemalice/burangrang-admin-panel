import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ThreatMitigationForm from './ThreatMitigationForm';
import threatMitigationService from '@/services/threatMitigationService';
import { ThreatMitigation } from '@/lib/types';

const EditThreatMitigationPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [threatMitigation, setThreatMitigation] = useState<ThreatMitigation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchThreatMitigation = async () => {
      try {
        if (!id) return;
        const data = await threatMitigationService.getById(id);
        setThreatMitigation(data);
      } catch (error) {
        toast.error('Failed to fetch threat mitigation');
        navigate('/master/threat-mitigations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchThreatMitigation();
  }, [id, navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!threatMitigation) {
    return null;
  }

  return <ThreatMitigationForm threatMitigation={threatMitigation} mode="edit" />;
};

export default EditThreatMitigationPage; 