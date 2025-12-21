import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import RiskMitigationForm from './RiskMitigationForm';
import { riskMitigationService } from '@/modules/master-data';
import { RiskMitigation } from '@/core/lib/types';

const EditRiskMitigationPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [riskMitigation, setRiskMitigation] = useState<RiskMitigation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRiskMitigation = async () => {
      try {
        if (!id) return;
        const data = await riskMitigationService.getById(id);
        setRiskMitigation(data);
      } catch (error) {
        toast.error('Failed to fetch risk mitigation');
        navigate('/master/risk-mitigations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRiskMitigation();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading risk mitigation details...</span>
        </div>
      </div>
    );
  }

  if (!riskMitigation) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Risk Mitigation not found
        </h2>
        <p className="text-gray-600 mb-4">
          The risk mitigation you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => navigate('/master/risk-mitigations')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Risk Mitigations
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Risk Mitigation"
        subtitle={`Modify the details of this risk mitigation`}
        actions={
          <Button variant="outline" onClick={() => navigate('/master/risk-mitigations')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Risk Mitigations
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <RiskMitigationForm riskMitigation={riskMitigation} mode="edit" />
      </div>
    </>
  );
};

export default EditRiskMitigationPage;
