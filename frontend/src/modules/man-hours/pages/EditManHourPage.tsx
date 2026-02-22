import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import ManHourForm from './ManHourForm';
import manHourService from '../services/manHourService';
import { ManHour } from '../types/man-hour.types';

export default function EditManHourPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [manHour, setManHour] = useState<ManHour | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchManHour = async () => {
      if (!id) {
        navigate('/man-hours');
        return;
      }

      try {
        const data = await manHourService.getManHour(id);
        setManHour(data);
      } catch (error) {
        console.error('Failed to fetch man hour:', error);
        toast.error('Failed to load man hour');
        navigate('/man-hours');
      } finally {
        setIsLoading(false);
      }
    };

    fetchManHour();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!manHour) {
    return null;
  }

  return (
    <>
      <PageHeader
        title="Edit Man Hour"
        subtitle={`Editing: ${manHour.name} - ${manHour.month} ${manHour.year}`}
        actions={
          <Button variant="outline" onClick={() => navigate('/man-hours')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Man Hours
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <ManHourForm manHour={manHour} mode="edit" />
      </div>
    </>
  );
}
