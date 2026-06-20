import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import EnvironmentalMeasurementForm from './EnvironmentalMeasurementForm';
import environmentalMeasurementService from '../services/environmentalMeasurementService';
import { EnvironmentalMeasurement } from '../types/environmental-measurement.types';

const EditEnvironmentalMeasurementPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [measurement, setMeasurement] = useState<EnvironmentalMeasurement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMeasurement = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const data = await environmentalMeasurementService.getMeasurement(id);
        setMeasurement(data);
      } catch (error) {
        console.error('Error fetching measurement:', error);
        toast.error('Failed to load environmental measurement');
        navigate('/environmental-measurements');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeasurement();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading measurement details...</span>
        </div>
      </div>
    );
  }

  if (!measurement) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Measurement not found</h2>
        <p className="text-gray-600 mb-4">
          The environmental measurement you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => navigate('/environmental-measurements')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Measurements
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Non Water Monitoring"
        subtitle={`Editing measurement for ${measurement.room?.name || 'Unknown Room'}`}
        actions={
          <Button variant="outline" onClick={() => navigate('/environmental-measurements')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Measurements
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <EnvironmentalMeasurementForm measurement={measurement} mode="edit" />
      </div>
    </>
  );
};

export default EditEnvironmentalMeasurementPage;
