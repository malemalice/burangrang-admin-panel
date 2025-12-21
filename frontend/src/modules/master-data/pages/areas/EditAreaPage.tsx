import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import PageHeader from '@/core/components/ui/PageHeader';
import AreaForm from './AreaForm';
import areaService from '../../services/areaService';
import { AreaDTO } from '../../types/master-data.types';

const EditAreaPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [area, setArea] = useState<AreaDTO | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArea = async () => {
      if (!id) return;
      try {
        const data = await areaService.getArea(id);
        setArea(data);
      } catch (error) {
        console.error('Error fetching area:', error);
        toast.error('Failed to load area data');
        navigate('/master/areas');
      } finally {
        setIsLoading(false);
      }
    };

    fetchArea();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Area"
        subtitle={`Edit area: ${area?.name}`}
      />

      <div className="max-w-4xl mx-auto">
        <AreaForm area={area} mode="edit" />
      </div>
    </div>
  );
};

export default EditAreaPage;
