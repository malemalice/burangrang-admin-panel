import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/ui/PageHeader';
import MasterApprovalForm from './MasterApprovalForm';

const CreateMasterApprovalPage = () => {
  return (
    <>
      <PageHeader
        title="Create Master Approval"
        subtitle="Create a new approval flow"
        backButton={
          <Button variant="ghost" className="gap-2" onClick={() => window.history.back()}>
            <ArrowLeft size={16} />
            Back
          </Button>
        }
      />
      <div className="container py-6 max-w-4xl">
        <MasterApprovalForm mode="create" />
      </div>
    </>
  );
};

export default CreateMasterApprovalPage; 