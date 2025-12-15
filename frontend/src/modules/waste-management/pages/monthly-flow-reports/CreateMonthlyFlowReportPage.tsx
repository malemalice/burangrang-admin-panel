import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MonthlyFlowReportForm from './MonthlyFlowReportForm';

export default function CreateMonthlyFlowReportPage() { 
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Create Monthly Flow Report" 
        description="Add a new flow report"
        actions={
          <Button variant="outline" onClick={() => navigate('/waste-management/monthly-flow-reports')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <MonthlyFlowReportForm mode="create" />
      </div>
    </div>
  );
}
