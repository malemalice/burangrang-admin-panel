import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import MasterApprovalForm from './MasterApprovalForm';

const CreateMasterApprovalPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Create Master Approval"
        subtitle="Create a new approval flow"
        actions={
          <Button variant="outline" onClick={() => navigate('/master/approvals')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Approvals
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <MasterApprovalForm mode="create" />
      </div>
    </>
  );
};

export default CreateMasterApprovalPage; 