import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import MasterApprovalForm from './MasterApprovalForm';
import masterApprovalService from '../../services/masterApprovalService';
import { MasterApproval } from '@/core/lib/types';

const EditMasterApprovalPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [approval, setApproval] = useState<MasterApproval | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchApproval = async () => {
      if (!id) return;

      try {
        const data = await masterApprovalService.getById(id);
        setApproval(data);
      } catch (error) {
        console.error('Failed to fetch approval:', error);
        toast.error('Failed to load approval data');
        navigate('/master/approvals');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApproval();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading approval details...</span>
        </div>
      </div>
    );
  }

  if (!approval) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Approval not found
        </h2>
        <p className="text-gray-600 mb-4">
          The approval you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => navigate('/master/approvals')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Approvals
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Master Approval"
        subtitle={`Edit approval flow settings for "${approval.name || approval.id}"`}
        actions={
          <Button variant="outline" onClick={() => navigate('/master/approvals')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Approvals
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <MasterApprovalForm mode="edit" approval={approval} />
      </div>
    </>
  );
};

export default EditMasterApprovalPage; 