import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import PageHeader from '@/core/components/ui/PageHeader';
import AuditScheduleForm from '../components/AuditScheduleForm';
import auditSchedulesService from '../services/auditSchedulesService';
import { AuditSchedule } from '../types/audit-schedule.types';

const EditAuditSchedulePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [auditSchedule, setAuditSchedule] = useState<AuditSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAuditSchedule = async () => {
      try {
        if (!id) return;
        const data = await auditSchedulesService.getById(id);
        setAuditSchedule(data);
      } catch (error) {
        toast.error('Failed to fetch audit schedule');
        navigate('/audit-schedules');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuditSchedule();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading audit schedule details...</span>
        </div>
      </div>
    );
  }

  if (!auditSchedule) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Audit schedule not found
        </h2>
        <p className="text-gray-600 mb-4">
          The audit schedule you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => navigate('/audit-schedules')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Audit Schedules
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Audit"
        subtitle={`Modify the details of "${auditSchedule.code}"`}
        actions={
          <Button variant="outline" onClick={() => navigate('/audit-schedules')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Audit Schedules
          </Button>
        }
      />
      <div className="max-w-4xl mx-auto">
        <AuditScheduleForm auditSchedule={auditSchedule} mode="edit" />
      </div>
    </>
  );
};

export default EditAuditSchedulePage;
