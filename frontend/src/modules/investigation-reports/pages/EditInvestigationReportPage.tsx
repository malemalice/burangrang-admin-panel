import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import PageHeader from '@/core/components/ui/PageHeader';
import { Button } from '@/core/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import investigationReportsService from '../services/investigationReportsService';
import type { InvestigationReport } from '../types/investigation-report.types';
import InvestigationReportForm from '../components/InvestigationReportForm';

const EditInvestigationReportPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<InvestigationReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    investigationReportsService
      .getById(id)
      .then(setReport)
      .catch(() => {
        toast.error('Failed to load investigation report');
        navigate('/investigation-reports');
      })
      .finally(() => setIsLoading(false));
  }, [id, navigate]);

  if (isLoading || !report || !report.incident) {
    return <div className="p-8 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${report.reportNumber}`}
        subtitle={`Incident ${report.incident.code} — ${report.incident.subject}`}
        actions={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />
      <InvestigationReportForm
        incident={report.incident}
        report={report}
        mode="edit"
      />
    </div>
  );
};

export default EditInvestigationReportPage;
