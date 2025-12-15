import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DispatchOrderForm from './DispatchOrderForm';

export default function CreateDispatchOrderPage() { 
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Create Dispatch Order" 
        description="Create a new dispatch job"
        actions={
          <Button variant="outline" onClick={() => navigate('/waste-management/dispatch-orders')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <DispatchOrderForm mode="create" />
      </div>
    </div>
  );
}
