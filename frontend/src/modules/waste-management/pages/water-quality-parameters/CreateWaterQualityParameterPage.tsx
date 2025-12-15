import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WaterQualityParameterForm from './WaterQualityParameterForm';

export default function CreateWaterQualityParameterPage() { 
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Create Water Quality Parameter" 
        description="Add a new parameter"
        actions={
          <Button variant="outline" onClick={() => navigate('/waste-management/water-quality-parameters')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <WaterQualityParameterForm mode="create" />
      </div>
    </div>
  );
}
