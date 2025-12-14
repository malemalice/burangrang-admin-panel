import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WasteSourceForm from './WasteSourceForm';

export default function EditWasteSourcePage() { 
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Edit Waste Source" 
        description="Update waste source information"
        actions={
          <Button variant="outline" onClick={() => navigate('/waste-management/waste-sources')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <WasteSourceForm mode="edit" />
      </div>
    </div>
  );
}
