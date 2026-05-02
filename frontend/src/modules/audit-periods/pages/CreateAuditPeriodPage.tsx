import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import AuditPeriodForm from '../components/AuditPeriodForm';

export default function CreateAuditPeriodPage() {
  const navigate = useNavigate();

  return (
    <>
      <div className="mb-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/audit-periods')}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Audit Periods
        </Button>
      </div>
      <PageHeader
        title="Create Audit Period"
        subtitle="Define a month and year. Audit schedules will be generated for all active audit elements."
      />
      <AuditPeriodForm />
    </>
  );
}
