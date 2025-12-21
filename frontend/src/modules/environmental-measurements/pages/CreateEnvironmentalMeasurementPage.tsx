import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import EnvironmentalMeasurementForm from './EnvironmentalMeasurementForm';

const CreateEnvironmentalMeasurementPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Create Environmental Measurement"
        subtitle="Record a new environmental measurement"
        actions={
          <Button variant="outline" onClick={() => navigate('/environmental-measurements')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Measurements
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <EnvironmentalMeasurementForm mode="create" />
      </div>
    </>
  );
};

export default CreateEnvironmentalMeasurementPage;
