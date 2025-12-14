import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WasteTypeForm from './WasteTypeForm';

export default function CreateWasteTypePage() { 
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Create Waste Type" 
        description="Add a new waste type"
        actions={
          <Button variant="outline" onClick={() => navigate('/waste-management/waste-types')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <WasteTypeForm mode="create" />
      </div>
    </div>
  );
}
