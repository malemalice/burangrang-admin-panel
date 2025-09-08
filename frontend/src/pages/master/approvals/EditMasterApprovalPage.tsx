import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import MasterApprovalForm from './MasterApprovalForm';
import masterApprovalService from '@/services/masterApprovalService';
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

  if (isLoading || !approval) {
    return null; // Or a loading spinner
  }

  return (
    <>
      <PageHeader
        title="Edit Master Approval"
        subtitle="Edit approval flow settings"
        actions={
          <Button variant="ghost" className="gap-2" onClick={() => window.history.back()}>
            <ArrowLeft size={16} />
            Back
          </Button>
        }
      />
      <div className="container py-6 max-w-4xl">
        <MasterApprovalForm mode="edit" approval={approval} />
      </div>
    </>
  );
};

export default EditMasterApprovalPage; 