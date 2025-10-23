import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ThreatForm from './ThreatForm';
import threatService from '@/services/threatService';
import { Threat } from '@/lib/types';

const EditThreatPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [threat, setThreat] = useState<Threat | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchThreat = async () => {
      try {
        if (!id) return;
        const data = await threatService.getById(id);
        setThreat(data);
      } catch (error) {
        console.error('Failed to fetch threat:', error);
        toast.error('Failed to fetch threat');
        navigate('/master/threats');
      } finally {
        setIsLoading(false);
      }
    };

    fetchThreat();
  }, [id, navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!threat) {
    return null;
  }

  return <ThreatForm threat={threat} mode="edit" />;
};

export default EditThreatPage; 