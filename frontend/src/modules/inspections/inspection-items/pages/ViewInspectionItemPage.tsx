import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Edit, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { usePDF } from 'react-to-pdf';

import { useAuth } from '@/core/lib/auth';
import api from '@/core/lib/api';
import { ROLE_CODES } from '@/shared/constants/role-codes.constants';
import roleService from '@/modules/roles/services/roleService';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Separator } from '@/core/components/ui/separator';
import { Badge } from '@/core/components/ui/badge';
import PageHeader from '@/core/components/ui/PageHeader';

import { InspectionItem, InspectionImageTypeEnum } from '../types/inspection-item.types';
import { INSPECTION_RISK_RATE_OPTIONS, INSPECTION_RISK_RATE_BADGE_CLASSES } from '@/shared/constants/inspection-risk-rate.enum';
import inspectionItemsService from '../services/inspectionItemsService';
import { InspectionItemPDFTemplate } from '../../components/InspectionItemPDFTemplate';
import { buildPdfOptions, generateTableAwarePdf } from '@/core/lib/pdfExport';
import type { InspectionChecklistDTO } from '@/modules/master-data/types/master-data.types';
import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';
import { approvalService, type ApprovalStatusHistory } from '@/modules/master-data';
import { ApprovalTimelineCard } from '@/modules/risk-assessment/components/ApprovalTimelineCard';

const ViewInspectionItemPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? '';
  const { user: currentUser } = useAuth();
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [item, setItem] = useState<InspectionItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalStatusHistory | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [checklistRoots, setChecklistRoots] = useState<InspectionChecklistDTO[]>([]);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const { targetRef } = usePDF(
    buildPdfOptions({ filename: 'inspection-item.pdf' }),
  );

  useEffect(() => {
    // Use options bypass so users without inspection-checklist:list permission can still load the tree
    api.get('/inspection-checklists/tree?options=true')
      .then((response) => setChecklistRoots(response.data))
      .catch((error) => console.error('Failed to load checklist tree:', error));
  }, []);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!currentUser?.id) return;
      try {
        const response = await api.get('/users/me');
        const userData = response.data;
        let roleCode: string | null = null;
        if (userData.role && typeof userData.role === 'object' && 'code' in userData.role) {
          roleCode = userData.role.code;
        }
        if (!roleCode && userData.roleId) {
          const role = await roleService.getRoleById(userData.roleId);
          roleCode = role.code;
        }
        setIsSuperUser(roleCode === ROLE_CODES.SUPER_ADMIN);
      } catch (error) {
        console.error('Failed to fetch user role:', error);
      }
    };
    fetchUserRole();
  }, [currentUser?.id]);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const data = await inspectionItemsService.getById(id);
        setItem(data);
      } catch (error) {
        console.error('Failed to fetch Inspection Finding Monitoring:', error);
        toast.error('Failed to load Inspection Finding Monitoring');
        navigate(`/inspections/items${returnTo}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [id, navigate]);

  // Fetch approval status/history
  useEffect(() => {
    const fetchApprovalStatus = async () => {
      if (!id) return;

      setIsLoadingHistory(true);
      try {
        const approvalStatus = await inspectionItemsService.checkApprovalStatus(id);
        // Handle backend error response (backend returns { error: true, message: string } on errors)
        if (approvalStatus && !(approvalStatus as any).error) {
          setApprovalHistory(approvalStatus);
        } else {
          // Backend returned an error response, but still set empty history
          setApprovalHistory({
            history: [],
            nextApprover: null,
            allApprovalLines: [],
            currentStatus: 'UNKNOWN',
          });
        }
      } catch (error) {
        console.error('Failed to fetch approval status:', error);
        // Set empty history instead of null, so component can still render
        setApprovalHistory({
          history: [],
          nextApprover: null,
          allApprovalLines: [],
          currentStatus: 'UNKNOWN',
        });
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchApprovalStatus();
  }, [id]);

  const handleExportPDF = async () => {
    if (!item) return;
    try {
      setIsExportingPDF(true);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const filename = `inspection-item-${item.inspection?.code ?? item.id}-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`;
      await generateTableAwarePdf(targetRef, buildPdfOptions({ filename }));
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const getStatusBadge = (status: GeneralStatusEnum) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      [GeneralStatusEnum.OPEN]: { label: 'Open Issue', variant: 'secondary' },
      [GeneralStatusEnum.WAITING_APPROVAL]: { label: 'Waiting Verification', variant: 'secondary' },
      [GeneralStatusEnum.CLOSE]: { label: 'Close', variant: 'default' },
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
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!item) {
    return null;
  }

  return (
    <>
      <PageHeader
        title="Inspection Finding Monitoring Details"
        subtitle="View detailed information about this Inspection Finding Monitoring"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/inspections/items${returnTo}`)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Inspection Finding Monitoring
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={isExportingPDF}
            >
              <FileDown className="mr-2 h-4 w-4" />
              {isExportingPDF ? 'Preparing PDF...' : 'Export PDF'}
            </Button>
            {(!item || (item.status !== GeneralStatusEnum.WAITING_APPROVAL && item.status !== GeneralStatusEnum.CLOSE) || isSuperUser) && (
              <Button onClick={() => navigate(`/inspections/items/${id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        }
      />

      {/* Hidden PDF template */}
      <div
        ref={targetRef}
        style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '210mm' }}
        aria-hidden="true"
      >
        <InspectionItemPDFTemplate item={item} checklistRoots={checklistRoots} />
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Basic Information and Approval Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Inspection Code</p>
                <p className="text-sm font-medium">
                  {item.inspection?.code || 'N/A'}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div>{getStatusBadge(item.status)}</div>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Area</p>
                <p className="text-sm">
                  {item.area?.name || item.areaId || 'N/A'}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Type of Hazard</p>
                <p className="text-sm">
                  {item.riskCategory?.name || item.riskCategoryId || 'N/A'}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Risk</p>
                <p className="text-sm">
                  {item.risk?.name || item.riskId || 'N/A'}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Assigned Department</p>
                <p className="text-sm">
                  {item.assignedDepartment?.name || item.assignedDepartmentId || 'N/A'}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Assignee</p>
                <p className="text-sm">
                  {item.assignee
                    ? `${item.assignee.firstName} ${item.assignee.lastName}`
                    : item.assigneeId || 'N/A'}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                <p className="text-sm">
                  {item.dueDateAt
                    ? format(new Date(item.dueDateAt), 'dd MMM yyyy HH:mm')
                    : 'N/A'}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Order</p>
                <p className="text-sm">{item.order}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Created At</p>
                <p className="text-sm">
                  {item.createdAt
                    ? format(new Date(item.createdAt), 'dd MMM yyyy HH:mm')
                    : 'N/A'}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Updated At</p>
                <p className="text-sm">
                  {item.updatedAt
                    ? format(new Date(item.updatedAt), 'dd MMM yyyy HH:mm')
                    : 'N/A'}
                </p>
              </div>
              </div>
              
              {/* Approval Timeline */}
              <div className="lg:border-l lg:pl-6 flex flex-col">
                <ApprovalTimelineCard
                  approvalHistory={approvalHistory}
                  isLoading={isLoadingHistory}
                  assessmentStatus={item.status === GeneralStatusEnum.CLOSE ? 'DONE' : item.status}
                  entityDepartmentName={item.assignedDepartment?.name}
                  entityJobPositionName="Department Head"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{item.description || 'N/A'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{item.findings || 'N/A'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Follow-up Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 rounded-md border bg-card text-card-foreground">
              <p className="text-sm whitespace-pre-wrap">{item.followUpNotes || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {(() => {
          const totalLeaves = checklistRoots.reduce((sum, root) => sum + (root.children?.length || 0), 0);
          const ratedLeaves = item.checklistResults?.filter((r) => r.riskRate).length ?? 0;
          const computedValue = totalLeaves > 0 ? (ratedLeaves / totalLeaves) * 100 : null;
          const finalValue = item.inspection?.finalInspectionValue ?? computedValue;
          return (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Checklist Results</CardTitle>
              {finalValue != null && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Final Inspection Value</p>
                  <p className="text-sm font-semibold">
                    {finalValue.toFixed(2)}% ({ratedLeaves}/{totalLeaves})
                  </p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!item.checklistResults || item.checklistResults.length === 0 ? (
              <p className="text-sm text-muted-foreground">No checklist results</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(
                  item.checklistResults.reduce<Record<string, NonNullable<typeof item.checklistResults>>>((acc, r) => {
                    const cat = r.checklistItem?.parent?.name ?? 'Uncategorized';
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat]!.push(r);
                    return acc;
                  }, {})
                ).map(([category, results]) => (
                  <div key={category}>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">{category}</h4>
                    <div className="space-y-2">
                      {results.map((result) => (
                        <div key={result.id} className="flex flex-col gap-1 rounded-md border bg-muted/30 px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm">{result.checklistItem?.name ?? result.checklistItemId}</span>
                            {result.riskRate ? (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${INSPECTION_RISK_RATE_BADGE_CLASSES[result.riskRate]}`}>
                                {INSPECTION_RISK_RATE_OPTIONS.find((o) => o.value === result.riskRate)?.label ?? result.riskRate}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Not rated</span>
                            )}
                          </div>
                          {result.notes && (
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap">{result.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
          );
        })()}

        <Card>
          <CardHeader>
            <CardTitle>Risk Mitigation</CardTitle>
          </CardHeader>
          <CardContent>
            {item.mitigation ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Elimination Control</p>
                  <p className="text-sm whitespace-pre-wrap">{item.mitigation.eliminationControl || 'N/A'}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Substitution Control</p>
                  <p className="text-sm whitespace-pre-wrap">{item.mitigation.substitutionControl || 'N/A'}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Engineering Control</p>
                  <p className="text-sm whitespace-pre-wrap">{item.mitigation.engineeringControl || 'N/A'}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Administration Control</p>
                  <p className="text-sm whitespace-pre-wrap">{item.mitigation.administrationControl || 'N/A'}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Personal Protective Equipment</p>
                  <p className="text-sm whitespace-pre-wrap">{item.mitigation.personalProtectiveEquipment || 'N/A'}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Transfer</p>
                  <p className="text-sm whitespace-pre-wrap">{item.mitigation.transfer || 'N/A'}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Accept</p>
                  <p className="text-sm whitespace-pre-wrap">{item.mitigation.accept || 'N/A'}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Legal Aspect & Standard reference</p>
                  <p className="text-sm whitespace-pre-wrap">{item.mitigation.legalAspect || 'N/A'}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">N/A</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Before Images */}
              <div>
                <h4 className="text-sm font-medium mb-3">
                  Before Images (Current Condition) ({item.images?.filter(img => img.type === InspectionImageTypeEnum.BEFORE).length || 0})
                </h4>
                {item.images && item.images.filter(img => img.type === InspectionImageTypeEnum.BEFORE).length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {item.images
                      .filter(img => img.type === InspectionImageTypeEnum.BEFORE)
                      .map((image) => (
                        <div key={image.id} className="space-y-2">
                          <img
                            src={image.imageUrl}
                            alt={image.caption || 'Before inspection image'}
                            className="w-full h-32 object-cover rounded-md border"
                          />
                          {image.caption && (
                            <p className="text-xs text-muted-foreground">{image.caption}</p>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No before images</p>
                )}
              </div>

              {/* After Images */}
              <div>
                <h4 className="text-sm font-medium mb-3">
                  After Images (After Fix/Action Plan) ({item.images?.filter(img => img.type === InspectionImageTypeEnum.AFTER).length || 0})
                </h4>
                {item.images && item.images.filter(img => img.type === InspectionImageTypeEnum.AFTER).length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {item.images
                      .filter(img => img.type === InspectionImageTypeEnum.AFTER)
                      .map((image) => (
                        <div key={image.id} className="space-y-2">
                          <img
                            src={image.imageUrl}
                            alt={image.caption || 'After inspection image'}
                            className="w-full h-32 object-cover rounded-md border"
                          />
                          {image.caption && (
                            <p className="text-xs text-muted-foreground">{image.caption}</p>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No after images</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ViewInspectionItemPage;
