import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WeightReportForm from './WeightReportForm';

export default function CreateWeightReportPage() { 
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Create Solid Waste Report" 
        description="Solid waste weight recording"
        actions={
          <Button variant="outline" onClick={() => navigate('/waste-management/weight-reports')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <WeightReportForm mode="create" />
      </div>
    </div>
  );
}
