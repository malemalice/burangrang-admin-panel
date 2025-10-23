import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import OfficeForm from './OfficeForm';
import officeService from '../../services/officeService';
import { Office } from '@/core/lib/types';

const EditOfficePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [office, setOffice] = useState<Office | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOffice = async () => {
      try {
        if (!id) return;
        const data = await officeService.getOfficeById(id);
        setOffice(data);
      } catch (error) {
        toast.error('Failed to fetch office');
        navigate('/master/offices');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffice();
  }, [id, navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!office) {
    return null;
  }

  return <OfficeForm office={office} mode="edit" />;
};

export default EditOfficePage; 