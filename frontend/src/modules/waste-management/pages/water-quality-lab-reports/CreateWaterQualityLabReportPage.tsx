import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WaterQualityLabReportForm from './WaterQualityLabReportForm';

export default function CreateWaterQualityLabReportPage() { 
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Create Water Quality Lab Report" 
        description="Add a new lab report"
        actions={
          <Button variant="outline" onClick={() => navigate('/waste-management/water-quality-lab-reports')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <WaterQualityLabReportForm mode="create" />
      </div>
    </div>
  );
}
