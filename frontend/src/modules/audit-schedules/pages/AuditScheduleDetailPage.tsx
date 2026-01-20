import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, FileEdit } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import PageHeader from '@/core/components/ui/PageHeader';
import { Badge } from '@/core/components/ui/badge';

import { AuditSchedule } from '../types/audit-schedule.types';
import auditSchedulesService from '../services/auditSchedulesService';
import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';

const AuditScheduleDetailPage = () => {
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

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      [GeneralStatusEnum.SCHEDULED]: { label: 'Scheduled', variant: 'outline' },
      [GeneralStatusEnum.DRAFT]: { label: 'Draft', variant: 'outline' },
      [GeneralStatusEnum.OPEN]: { label: 'Open', variant: 'secondary' },
      [GeneralStatusEnum.WAITING_APPROVAL]: { label: 'Waiting Approval', variant: 'secondary' },
      [GeneralStatusEnum.DONE]: { label: 'Done', variant: 'default' },
      [GeneralStatusEnum.REJECTED]: { label: 'Rejected', variant: 'destructive' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };

    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
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
        title="Audit Schedule Details"
        subtitle={`View details for "${auditSchedule.code}"`}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => navigate(`/audit-schedules/${auditSchedule.id}/edit`)}
            >
              <FileEdit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" onClick={() => navigate('/audit-schedules')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </>
        }
      />
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Audit schedule details and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Code</label>
                <p className="text-sm font-medium">{auditSchedule.code}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">{getStatusBadge(auditSchedule.status)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Audit Date</label>
                <p className="text-sm font-medium">
                  {auditSchedule.auditDate
                    ? format(new Date(auditSchedule.auditDate), 'dd MMM yyyy')
                    : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Audit Element</label>
                <p className="text-sm font-medium">
                  {auditSchedule.auditElement?.name || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Active</label>
                <p className="text-sm font-medium">
                  {auditSchedule.isActive ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created At</label>
                <p className="text-sm font-medium">
                  {auditSchedule.createdAt
                    ? format(new Date(auditSchedule.createdAt), 'dd MMM yyyy HH:mm')
                    : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Areas</CardTitle>
            <CardDescription>Areas covered by this audit</CardDescription>
          </CardHeader>
          <CardContent>
            {auditSchedule.areas && auditSchedule.areas.length > 0 ? (
              <div className="space-y-2">
                {auditSchedule.areas.map((area) => (
                  <div key={area.id} className="text-sm">
                    {area.name}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No areas assigned</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Auditors</CardTitle>
            <CardDescription>Users assigned as auditors</CardDescription>
          </CardHeader>
          <CardContent>
            {auditSchedule.auditors && auditSchedule.auditors.length > 0 ? (
              <div className="space-y-2">
                {auditSchedule.auditors.map((auditor) => (
                  <div key={auditor.id} className="text-sm">
                    {auditor.firstName} {auditor.lastName} ({auditor.email})
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No auditors assigned</p>
            )}
          </CardContent>
        </Card>

        {auditSchedule.creator && (
          <Card>
            <CardHeader>
              <CardTitle>Created By</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {auditSchedule.creator.firstName} {auditSchedule.creator.lastName} ({auditSchedule.creator.email})
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default AuditScheduleDetailPage;
