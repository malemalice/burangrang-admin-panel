import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import PageHeader from '@/core/components/ui/PageHeader';
import DataTable from '@/core/components/ui/data-table/DataTable';

import auditSchedulesService from '../services/auditSchedulesService';
import auditPolicyService from '@/modules/audit-policy/services/auditPolicyService';
import { AuditClause, AuditCriteria } from '@/modules/audit-policy/types/audit-policy.types';
import { AuditSchedule } from '../types/audit-schedule.types';

const AuditClauseCriteriaPage = () => {
  const { id, clauseId } = useParams<{ id: string; clauseId: string }>();
  const navigate = useNavigate();
  const [auditSchedule, setAuditSchedule] = useState<AuditSchedule | null>(null);
  const [auditClause, setAuditClause] = useState<AuditClause | null>(null);
  const [auditCriteria, setAuditCriteria] = useState<AuditCriteria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingClause, setIsLoadingClause] = useState(true);
  const [isLoadingCriteria, setIsLoadingCriteria] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalCriteria, setTotalCriteria] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !clauseId) return;

      try {
        setIsLoading(true);
        const [scheduleData, clauseData] = await Promise.all([
          auditSchedulesService.getById(id),
          auditPolicyService.getClauseById(clauseId),
        ]);
        setAuditSchedule(scheduleData);
        setAuditClause(clauseData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to fetch audit schedule or clause');
        navigate(`/audit-schedules/${id}`);
      } finally {
        setIsLoading(false);
        setIsLoadingClause(false);
      }
    };

    fetchData();
  }, [id, clauseId, navigate]);

  useEffect(() => {
    const fetchAuditCriteria = async () => {
      if (!clauseId) return;

      try {
        setIsLoadingCriteria(true);
        const response = await auditPolicyService.getCriteria({
          page: pageIndex + 1,
          limit,
          auditClauseId: clauseId,
          isActive: true,
          sortBy: 'order',
          sortOrder: 'asc',
        });
        setAuditCriteria(response.data);
        setTotalCriteria(response.meta.total);
      } catch (error) {
        console.error('Failed to fetch audit criteria:', error);
        toast.error('Failed to fetch audit criteria');
      } finally {
        setIsLoadingCriteria(false);
      }
    };

    fetchAuditCriteria();
  }, [clauseId, pageIndex, limit]);

  if (isLoading || isLoadingClause) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <span>Loading audit clause details...</span>
        </div>
      </div>
    );
  }

  if (!auditSchedule || !auditClause) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Audit clause not found
        </h2>
        <p className="text-gray-600 mb-4">
          The audit clause you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => navigate(`/audit-schedules/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Audit Schedule
        </Button>
      </div>
    );
  }

  const auditCriteriaColumns = [
    {
      id: 'code',
      header: 'Code',
      cell: (criterion: AuditCriteria) => (
        <div className="font-medium">{criterion.code}</div>
      ),
      isSortable: true,
    },
    {
      id: 'name',
      header: 'Name',
      cell: (criterion: AuditCriteria) => (
        <div>{criterion.name}</div>
      ),
      isSortable: true,
    },
    {
      id: 'description',
      header: 'Description',
      cell: (criterion: AuditCriteria) => (
        <div className="text-sm text-muted-foreground">
          {criterion.description || 'N/A'}
        </div>
      ),
      isSortable: false,
    },
    {
      id: 'transitionType',
      header: 'Transition Type',
      cell: (criterion: AuditCriteria) => (
        <div className="text-sm">{criterion.transitionType}</div>
      ),
      isSortable: true,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Audit Clause: ${auditClause.name}`}
        subtitle={`From Audit Schedule: ${auditSchedule.code}`}
        actions={
          <Button variant="outline" onClick={() => navigate(`/audit-schedules/${id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Audit Schedule
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Audit Clause Details</CardTitle>
          <CardDescription>Basic information for this audit clause</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Code</label>
              <p className="text-sm font-medium">{auditClause.code}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <p className="text-sm font-medium">{auditClause.name}</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="text-sm font-medium">
                {auditClause.description || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Audit Element</label>
              <p className="text-sm font-medium">
                {auditClause.auditElement?.name || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Active</label>
              <p className="text-sm font-medium">
                {auditClause.isActive ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Criteria Section */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Criteria</CardTitle>
          <CardDescription>
            All audit criteria with status active for audit clause: {auditClause.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={auditCriteriaColumns}
            data={auditCriteria}
            isLoading={isLoadingCriteria}
            pagination={{
              pageIndex,
              limit,
              pageCount: Math.ceil(totalCriteria / limit),
              onPageChange: setPageIndex,
              onPageSizeChange: setLimit,
              total: totalCriteria,
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

export default AuditClauseCriteriaPage;
