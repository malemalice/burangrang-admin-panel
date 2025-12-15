import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import RiskMatrixForm from './RiskMatrixForm';
import { useRiskMatrix } from '../hooks/useRiskMatrix';

const EditRiskMatrixPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { riskMatrix, isLoading, error } = useRiskMatrix(id || null);

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Edit Risk Matrix Entry"
          subtitle="Update risk matrix entry details"
          actions={
            <Button variant="outline" onClick={() => navigate('/risk-matrix')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Risk Matrix
            </Button>
          }
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading risk matrix details...</span>
          </div>
        </div>
      </>
    );
  }

  if (error || !riskMatrix) {
    return (
      <>
        <PageHeader
          title="Edit Risk Matrix Entry"
          subtitle="Update risk matrix entry details"
          actions={
            <Button variant="outline" onClick={() => navigate('/risk-matrix')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Risk Matrix
            </Button>
          }
        />
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Risk Matrix Entry not found</h2>
          <p className="text-gray-600 mb-4">
            The risk matrix entry you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => navigate('/risk-matrix')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Risk Matrix
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Risk Matrix Entry"
        subtitle="Update risk matrix entry details"
        actions={
          <Button variant="outline" onClick={() => navigate('/risk-matrix')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Risk Matrix
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <RiskMatrixForm riskMatrix={riskMatrix} mode="edit" />
      </div>
    </>
  );
};

export default EditRiskMatrixPage;
