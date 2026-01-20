import { useState, useEffect, useMemo } from 'react';
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
import { AuditClause, AuditCriteria } from '@/modules/audit-policy/types/audit-policy.types';
import api from '@/core/lib/api';

// Component for assessment status with tooltip
const AssessmentStatusCell = ({ stats }: { stats: { total: number; filled: number; comply: number; notComply: number } }) => {
  const [open, setOpen] = useState(false);
  
  return (
    <Tooltip open={open} onOpenChange={setOpen} delayDuration={200}>
      <TooltipTrigger asChild>
        <div 
          className="flex flex-col items-center gap-1.5 cursor-help w-full"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
        >
          <div className="text-sm font-medium tabular-nums">
            {stats.filled}/{stats.total}
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 text-green-700">
              <span className="text-xs tabular-nums font-medium">{stats.comply}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-700">
              <span className="text-xs tabular-nums font-medium">{stats.notComply}</span>
            </div>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs space-y-1">
          <div>Total: {stats.total} | Filled: {stats.filled}</div>
          <div>Comply: {stats.comply} | Not Comply: {stats.notComply}</div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

interface AuditItem {
  id: string;
  auditId: string;
  auditCriteriaId: string;
  status: string;
  compliantStatus: string;
  evidence?: string;
  recommendation?: string;
  actionRealization?: string;
  order: number;
  dueDate: Date;
  auditCriteria?: AuditCriteria;
  departments?: Array<{ departmentId: string }>;
  users?: Array<{ userId: string }>;
  images?: Array<{
    id: string;
    imageUrl: string;
    caption?: string;
    order: number;
  }>;
}

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
  const [auditItems, setAuditItems] = useState<AuditItem[]>([]);
  const [allCriteria, setAllCriteria] = useState<AuditCriteria[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

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

  // Fetch audit items and criteria for summary calculation
  useEffect(() => {
    const fetchSummaryData = async () => {
      if (!id || !auditSchedule?.auditElementId) return;

      try {
        setIsLoadingSummary(true);

        // Fetch all clauses to get their IDs
        const clausesResponse = await auditPolicyService.getClauses({
          page: 1,
          limit: 10000,
          auditElementId: auditSchedule.auditElementId,
          isActive: true,
          sortBy: 'order',
          sortOrder: 'asc',
        });
        const allClauses = clausesResponse.data;
        const clauseIds = allClauses.map(c => c.id);

        // Fetch all criteria for all clauses
        const criteriaPromises = clauseIds.map(clauseId =>
          auditPolicyService.getCriteria({
            page: 1,
            limit: 10000,
            auditClauseId: clauseId,
            isActive: true,
            sortBy: 'order',
            sortOrder: 'asc',
          })
        );
        const criteriaResponses = await Promise.all(criteriaPromises);
        const allCriteriaData = criteriaResponses.flatMap(res => res.data);
        setAllCriteria(allCriteriaData);

        // Fetch audit items
        try {
          const auditResponse = await api.get(`/audits/${id}/items`, {
            params: {
              page: 1,
              limit: 10000,
            },
          });
          if (auditResponse?.data?.data) {
            setAuditItems(auditResponse.data.data);
          }
        } catch (error) {
          console.log('Audit items endpoint not available or no items found');
        }
      } catch (error) {
        console.error('Failed to fetch summary data:', error);
      } finally {
        setIsLoadingSummary(false);
      }
    };

    fetchSummaryData();
  }, [id, auditSchedule?.auditElementId]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const total = allCriteria.length;
    const filled = auditItems.length;
    const comply = auditItems.filter(
      item => item.compliantStatus === 'COMPLY'
    ).length;
    const notComply = auditItems.filter(
      item => item.compliantStatus === 'NOT_COMPLY_MAJOR' || 
              item.compliantStatus === 'NOT_COMPLY_MINOR'
    ).length;
    
    return { total, filled, comply, notComply };
  }, [allCriteria, auditItems]);

  // Calculate assessment status for each clause
  const getClauseAssessmentStatus = (clause: AuditClause) => {
    const clauseCriteria = allCriteria.filter(c => c.auditClauseId === clause.id);
    const clauseCriteriaIds = clauseCriteria.map(c => c.id);
    const clauseItems = auditItems.filter(item => clauseCriteriaIds.includes(item.auditCriteriaId));
    
    const total = clauseCriteria.length;
    const filled = clauseItems.length;
    const comply = clauseItems.filter(item => item.compliantStatus === 'COMPLY').length;
    const notComply = clauseItems.filter(
      item => item.compliantStatus === 'NOT_COMPLY_MAJOR' || 
              item.compliantStatus === 'NOT_COMPLY_MINOR'
    ).length;

    return { total, filled, comply, notComply };
  };

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
      id: 'assessmentStatus',
      header: 'Status',
      cell: (clause: AuditClause) => {
        const status = getClauseAssessmentStatus(clause);
        return <AssessmentStatusCell stats={status} />;
      },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Overview of audit items status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingSummary ? (
              <div className="flex items-center justify-center py-8">
                <span className="text-sm text-muted-foreground">Loading summary...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Audit Items</label>
                  <p className="text-2xl font-semibold">{summaryStats.total}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Already Filled</label>
                  <p className="text-2xl font-semibold">{summaryStats.filled}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Comply</label>
                  <p className="text-2xl font-semibold text-green-600">{summaryStats.comply}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Not Comply</label>
                  <p className="text-2xl font-semibold text-red-600">{summaryStats.notComply}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
