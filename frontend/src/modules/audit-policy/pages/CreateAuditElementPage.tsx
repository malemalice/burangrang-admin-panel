import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import { AuditElementForm } from '../components/AuditElementForm';
import auditPolicyService from '../services/auditPolicyService';
import { useState } from 'react';

const CreateAuditElementPage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const element = await auditPolicyService.createElement(data);
      toast.success('Audit element created successfully');
      navigate(`/audit-policy/${element.id}`);
    } catch (error: any) {
      console.error('Failed to create audit element:', error);
      toast.error(error?.response?.data?.message || 'Failed to create audit element');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Create Audit Element"
        subtitle="Add a new audit policy element"
        actions={
          <Button variant="outline" onClick={() => navigate('/audit-policy')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Audit Policy
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <AuditElementForm mode="create" onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </>
  );
};

export default CreateAuditElementPage;