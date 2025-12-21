import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TreatmentPlantForm from './TreatmentPlantForm';

export default function CreateTreatmentPlantPage() { 
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Create Treatment Plant" 
        description="Add a new treatment plant to the system"
        actions={
          <Button variant="outline" onClick={() => navigate('/waste-management/treatment-plants')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <TreatmentPlantForm mode="create" />
      </div>
    </div>
  );
}
