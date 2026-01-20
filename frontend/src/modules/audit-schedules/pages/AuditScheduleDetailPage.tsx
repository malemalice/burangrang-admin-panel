import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, FileEdit, Eye } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import PageHeader from '@/core/components/ui/PageHeader';
import { Badge } from '@/core/components/ui/badge';
import DataTable from '@/core/components/ui/data-table/DataTable';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/core/components/ui/tooltip';

import { AuditSchedule } from '../types/audit-schedule.types';
import auditSchedulesService from '../services/auditSchedulesService';
import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';
import auditPolicyService from '@/modules/audit-policy/services/auditPolicyService';
import { AuditClause } from '@/modules/audit-policy/types/audit-policy.types';

const AuditScheduleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [auditSchedule, setAuditSchedule] = useState<AuditSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [auditClauses, setAuditClauses] = useState<AuditClause[]>([]);
  const [isLoadingClauses, setIsLoadingClauses] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalClauses, setTotalClauses] = useState(0);

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

  useEffect(() => {
    const fetchAuditClauses = async () => {
      if (!auditSchedule?.auditElementId) return;

      try {
        setIsLoadingClauses(true);
        const response = await auditPolicyService.getClauses({
          page: pageIndex + 1,
          limit,
          auditElementId: auditSchedule.auditElementId,
          isActive: true,
          sortBy: 'order',
          sortOrder: 'asc',
        });
        setAuditClauses(response.data);
        setTotalClauses(response.meta.total);
      } catch (error) {
        console.error('Failed to fetch audit clauses:', error);
        toast.error('Failed to fetch audit clauses');
      } finally {
        setIsLoadingClauses(false);
      }
    };

    fetchAuditClauses();
  }, [auditSchedule?.auditElementId, pageIndex, limit]);

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

  const handleViewClauseDetail = (clause: AuditClause) => {
    navigate(`/audit-schedules/${id}/clauses/${clause.id}`);
  };

  const auditClauseColumns = [
    {
      id: 'code',
      header: 'Code',
      cell: (clause: AuditClause) => (
        <div className="font-medium">{clause.code}</div>
      ),
      isSortable: true,
    },
    {
      id: 'name',
      header: 'Name',
      cell: (clause: AuditClause) => (
        <div>{clause.name}</div>
      ),
      isSortable: true,
    },
    {
      id: 'description',
      header: 'Description',
      cell: (clause: AuditClause) => (
        <div className="text-sm text-muted-foreground">
          {clause.description || 'N/A'}
        </div>
      ),
      isSortable: false,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (clause: AuditClause) => (
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleViewClauseDetail(clause)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Detail</p>
            </TooltipContent>
          </Tooltip>
        </div>
      ),
      isSortable: false,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Audit Schedule: ${auditSchedule.code}`}
        subtitle={`Created on ${format(new Date(auditSchedule.createdAt), 'dd MMM yyyy')}`}
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
      >
        <div className="flex items-center gap-3">
          {getStatusBadge(auditSchedule.status)}
        </div>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Audit Schedule Details</CardTitle>
          <CardDescription>Basic information for this audit schedule</CardDescription>
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

      {/* Audit Clauses Section */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Clauses</CardTitle>
          <CardDescription>
            All audit clauses with status active for audit element: {auditSchedule.auditElement?.name || 'N/A'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={auditClauseColumns}
            data={auditClauses}
            isLoading={isLoadingClauses}
            pagination={{
              pageIndex,
              limit,
              pageCount: Math.ceil(totalClauses / limit),
              onPageChange: setPageIndex,
              onPageSizeChange: setLimit,
              total: totalClauses,
            }}
            filterFields={[]}
            onSearch={() => {}}
            onApplyFilters={() => {}}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditScheduleDetailPage;
