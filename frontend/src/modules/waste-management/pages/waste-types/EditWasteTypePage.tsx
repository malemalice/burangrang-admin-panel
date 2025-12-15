import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WasteTypeForm from './WasteTypeForm';

export default function EditWasteTypePage() { 
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Edit Waste Type" 
        description="Update waste type information"
        actions={
          <Button variant="outline" onClick={() => navigate('/waste-management/waste-types')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <WasteTypeForm mode="edit" />
      </div>
    </div>
  );
}
