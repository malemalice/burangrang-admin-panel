import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Edit } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import PageHeader from '@/core/components/ui/PageHeader';

// Reusable Field component for consistent layout
const Field = ({ label, value, spanFull = false }: { label: string; value: React.ReactNode; spanFull?: boolean }) => (
  <div className={spanFull ? 'md:col-span-2' : ''}>
    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">{label}</label>
    <div className="text-sm break-words">{value ?? '—'}</div>
  </div>
);

import auditSchedulesService from '../services/auditSchedulesService';
import auditPolicyService from '@/modules/audit-policy/services/auditPolicyService';
import { AuditClause, AuditCriteria } from '@/modules/audit-policy/types/audit-policy.types';
import { AuditSchedule } from '../types/audit-schedule.types';
import api from '@/core/lib/api';
import departmentService from '@/modules/master-data/services/departmentService';
import { Department } from '@/modules/master-data/types/master-data.types';

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
  createdAt?: Date;
  updatedAt?: Date;
  auditCriteria?: AuditCriteria;
  departmentIds?: string[];
  userIds?: string[];
  images?: Array<{
    id: string;
    imageUrl: string;
    caption?: string;
    order: number;
  }>;
}

const ViewAuditCriteriaPage = () => {
  const { id, clauseId, criteriaId } = useParams<{ id: string; clauseId: string; criteriaId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [auditSchedule, setAuditSchedule] = useState<AuditSchedule | null>(null);
  const [auditClause, setAuditClause] = useState<AuditClause | null>(null);
  const [auditCriteria, setAuditCriteria] = useState<AuditCriteria | null>(null);
  const [auditItem, setAuditItem] = useState<AuditItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentMap, setDepartmentMap] = useState<Record<string, string>>({});

  // Determine where to navigate back to
  const getBackPath = () => {
    const returnTo = (location.state as { returnTo?: string })?.returnTo;
    if (returnTo) {
      return returnTo;
    }
    // Default: go back to audit clause/criteria page
    return `/audit-schedules/${id}/clauses/${clauseId}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !clauseId || !criteriaId) return;

      try {
        setIsLoading(true);
        
        // Fetch audit schedule, clause, and criteria
        const [scheduleData, clauseData, criteriaData] = await Promise.all([
          auditSchedulesService.getById(id),
          auditPolicyService.getClauseById(clauseId),
          auditPolicyService.getCriterionById(criteriaId),
        ]);
        
        setAuditSchedule(scheduleData);
        setAuditClause(clauseData);
        setAuditCriteria(criteriaData);

        // Try to fetch audit item
        try {
          const auditResponse = await api.get(`/audits/${id}/items`, {
            params: {
              page: 1,
              limit: 10000,
            },
          });
          
          if (auditResponse?.data?.data) {
            const items = auditResponse.data.data as AuditItem[];
            const item = items.find((item: AuditItem) => item.auditCriteriaId === criteriaId);
            if (item) {
              setAuditItem(item);
            }
          }
        } catch (error) {
          console.log('Audit item not found or endpoint not available');
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to fetch audit criteria details');
        if (id && clauseId) {
          const returnTo = (location.state as { returnTo?: string })?.returnTo;
          navigate(returnTo || `/audit-schedules/${id}/clauses/${clauseId}`);
        } else {
          navigate('/audit-results');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, clauseId, criteriaId, navigate]);

  // Fetch departments for department name lookup
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await departmentService.getDepartments({ page: 1, limit: 1000 });
        setDepartments(response.data);
        // Create a map of department ID to name for quick lookup
        const map: Record<string, string> = {};
        response.data.forEach((dept) => {
          map[dept.id] = dept.name;
        });
        setDepartmentMap(map);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      }
    };
    fetchDepartments();
  }, []);

  const getCompliantStatusBadge = (status?: string) => {
    if (!status) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-600">
          Not Filled
        </Badge>
      );
    }
    
    switch (status) {
      case 'COMPLY':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-800">
            Comply
          </Badge>
        );
      case 'NOT_COMPLY_MAJOR':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-800">
            Not Comply (Major)
          </Badge>
        );
      case 'NOT_COMPLY_MINOR':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-800">
            Not Comply (Minor)
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <span>Loading audit criteria details...</span>
        </div>
      </div>
    );
  }

  if (!auditSchedule || !auditClause || !auditCriteria) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Audit criteria not found
        </h2>
        <p className="text-gray-600 mb-4">
          The audit criteria you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => navigate(getBackPath())}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Audit Criteria Result"
        subtitle={`${auditSchedule.code} • ${auditClause.name}`}
        actions={
          <div className="flex gap-2 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => navigate(getBackPath())}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={() => navigate(`/audit-schedules/${id}/clauses/${clauseId}`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              {auditItem ? 'Edit' : 'Fill Audit Item'}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Criteria Information */}
        <Card>
          <CardHeader>
            <CardTitle>Criteria Information</CardTitle>
            <CardDescription>Master criteria details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Code" value={auditCriteria.code} />
              <Field label="Order" value={auditCriteria.order} />
              <Field label="Name" value={auditCriteria.name} spanFull />
              <Field label="Transition Type" value={auditCriteria.transitionType} />
              <Field 
                label="Description" 
                value={
                  auditCriteria.description ? (
                    <p className="whitespace-pre-wrap text-muted-foreground">
                      {auditCriteria.description}
                    </p>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )
                } 
                spanFull 
              />
            </div>
          </CardContent>
        </Card>

        {/* Context Information - Hierarchy */}
        <Card>
          <CardHeader>
            <CardTitle>Context Information</CardTitle>
            <CardDescription>Hierarchy from audit criteria to element</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Audit Element */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Audit Element</label>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-muted-foreground">
                    {auditSchedule.auditElement?.code || '—'}
                  </span>
                  <span className="text-sm">•</span>
                  <span className="text-sm break-words">
                    {auditSchedule.auditElement?.name || '—'}
                  </span>
                </div>
              </div>

              {/* Audit Clause */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Audit Clause</label>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-muted-foreground">
                    {auditClause.code}
                  </span>
                  <span className="text-sm">•</span>
                  <span className="text-sm break-words">
                    {auditClause.name}
                  </span>
                </div>
              </div>

              {/* Audit Criteria */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Audit Criteria</label>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-muted-foreground">
                    {auditCriteria.code}
                  </span>
                  <span className="text-sm">•</span>
                  <span className="text-sm break-words">
                    {auditCriteria.name}
                  </span>
                </div>
              </div>

              {/* Audit Schedule */}
              <div className="space-y-2 pt-2 border-t">
                <label className="text-sm font-medium text-muted-foreground">Audit Schedule</label>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-muted-foreground">
                    {auditSchedule.code}
                  </span>
                  <span className="text-sm">•</span>
                  <span className="text-sm">
                    {format(new Date(auditSchedule.auditDate), 'dd MMM yyyy')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Item Information */}
      {auditItem ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Audit Item Details</CardTitle>
              <CardDescription>Filled audit item information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field 
                  label="Compliant Status" 
                  value={getCompliantStatusBadge(auditItem.compliantStatus)} 
                />
                <Field 
                  label="Due Date" 
                  value={format(new Date(auditItem.dueDate), 'dd MMM yyyy')} 
                />
                <Field 
                  label="Evidence" 
                  value={
                    auditItem.evidence ? (
                      <p className="whitespace-pre-wrap text-muted-foreground">
                        {auditItem.evidence}
                      </p>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )
                  } 
                  spanFull 
                />
                <Field 
                  label="Recommendation" 
                  value={
                    auditItem.recommendation ? (
                      <p className="whitespace-pre-wrap text-muted-foreground">
                        {auditItem.recommendation}
                      </p>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )
                  } 
                  spanFull 
                />
                <Field 
                  label="Action Realization" 
                  value={
                    auditItem.actionRealization ? (
                      <p className="whitespace-pre-wrap text-muted-foreground">
                        {auditItem.actionRealization}
                      </p>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )
                  } 
                  spanFull 
                />
              </div>
            </CardContent>
          </Card>

          {/* Departments and Users */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Departments & Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Departments
                  </label>
                  {auditItem.departmentIds && auditItem.departmentIds.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {auditItem.departmentIds.map((deptId) => {
                        const deptName = departmentMap[deptId] || deptId;
                        return (
                          <Badge key={deptId} variant="outline">
                            {deptName}
                          </Badge>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No departments assigned</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Users
                  </label>
                  {auditItem.userIds && auditItem.userIds.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {auditItem.userIds.map((userId) => (
                        <Badge key={userId} variant="outline">
                          {userId}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No users assigned</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          {auditItem.images && auditItem.images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Evidence Images</CardTitle>
                <CardDescription>
                  {auditItem.images.length} image(s) attached
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {auditItem.images
                    .sort((a, b) => a.order - b.order)
                    .map((image) => (
                      <div key={image.id} className="space-y-2">
                        <a
                          href={image.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block aspect-video rounded-lg border overflow-hidden bg-muted/50 hover:opacity-90 transition-opacity"
                        >
                          <img
                            src={image.imageUrl}
                            alt={image.caption || 'Evidence image'}
                            className="w-full h-full object-cover"
                          />
                        </a>
                        {image.caption && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {image.caption}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Audit Item</CardTitle>
            <CardDescription>No audit item has been filled for this criteria yet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">
                This criteria has not been filled yet.
              </p>
              <Button
                onClick={() => navigate(`/audit-schedules/${id}/clauses/${clauseId}`, {
                  state: { returnTo: getBackPath() }
                })}
                variant="outline"
              >
                <Edit className="mr-2 h-4 w-4" />
                Fill Audit Item
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ViewAuditCriteriaPage;
