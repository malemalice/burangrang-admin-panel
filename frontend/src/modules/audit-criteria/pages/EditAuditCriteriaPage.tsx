import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import AuditCriteriaForm from './AuditCriteriaForm';
import auditCriteriaService from '../services/auditCriteriaService';
import { AuditCriteria } from '../types/audit-criteria.types';

const EditAuditCriteriaPage = () => {
  const { criteriaId } = useParams<{ criteriaId: string }>();
  const navigate = useNavigate();
  const [criteria, setCriteria] = useState<AuditCriteria | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCriteria = async () => {
      try {
        if (!criteriaId) return;
        const data = await auditCriteriaService.getAuditCriteriaById(criteriaId);
        setCriteria(data);
      } catch (error) {
        toast.error('Failed to fetch audit criteria');
        navigate('/audit-criteria');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCriteria();
  }, [criteriaId, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading audit criteria details...</span>
        </div>
      </div>
    );
  }

  if (!criteria) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Audit Criteria not found
        </h2>
        <p className="text-gray-600 mb-4">
          The audit criteria you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => navigate('/audit-criteria')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Audit Criteria
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Audit Criteria"
        actions={
          <Button variant="outline" onClick={() => navigate('/audit-criteria')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Audit Criteria
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <AuditCriteriaForm criteria={criteria} mode="edit" />
      </div>
    </>
  );
};

export default EditAuditCriteriaPage;
