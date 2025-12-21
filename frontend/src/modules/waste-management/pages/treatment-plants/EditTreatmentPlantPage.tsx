import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TreatmentPlantForm from './TreatmentPlantForm';

export default function EditTreatmentPlantPage() { 
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Edit Treatment Plant" 
        description="Update treatment plant information"
        actions={
          <Button variant="outline" onClick={() => navigate('/waste-management/treatment-plants')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <TreatmentPlantForm mode="edit" />
      </div>
    </div>
  );
}
