import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import AuditCriteriaForm from './AuditCriteriaForm';

const CreateAuditCriteriaPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Create Audit Criteria"
        subtitle="Add a new audit criteria to the system"
        actions={
          <Button variant="outline" onClick={() => navigate('/audit-criteria')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Audit Criteria
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <AuditCriteriaForm mode="create" />
      </div>
    </>
  );
};

export default CreateAuditCriteriaPage;
