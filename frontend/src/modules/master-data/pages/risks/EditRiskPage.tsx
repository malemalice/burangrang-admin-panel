import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import RiskForm from './RiskForm';
import { riskService } from '@/modules/master-data';
import { Risk } from '@/core/lib/types';

const EditRiskPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [risk, setRisk] = useState<Risk | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRisk = async () => {
      try {
        if (!id) return;
        const data = await riskService.getById(id);
        setRisk(data);
      } catch (error) {
        console.error('Failed to fetch risk:', error);
        toast.error('Failed to fetch risk');
        navigate('/master/risks');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRisk();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading risk details...</span>
        </div>
      </div>
    );
  }

  if (!risk) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Risk not found
        </h2>
        <p className="text-gray-600 mb-4">
          The risk you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => navigate('/master/risks')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Risks
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Risk"
        subtitle={`Modify the details of "${risk.name}"`}
        actions={
          <Button variant="outline" onClick={() => navigate('/master/risks')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Risks
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <RiskForm risk={risk} mode="edit" />
      </div>
    </>
  );
};

export default EditRiskPage;
