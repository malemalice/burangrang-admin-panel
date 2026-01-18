import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Edit } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Separator } from '@/core/components/ui/separator';
import { Badge } from '@/core/components/ui/badge';
import PageHeader from '@/core/components/ui/PageHeader';

import { InspectionItem, InspectionImageTypeEnum } from '../types/inspection-item.types';
import inspectionItemsService from '../services/inspectionItemsService';
import { IssueStatus } from '@/shared/constants/issue-status.enum';

const ViewInspectionItemPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<InspectionItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const data = await inspectionItemsService.getById(id);
        setItem(data);
      } catch (error) {
        console.error('Failed to fetch inspection item:', error);
        toast.error('Failed to load inspection item');
        navigate('/inspections/items');
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [id, navigate]);

  const getStatusBadge = (status: IssueStatus) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      [IssueStatus.OPEN]: { label: 'Open Issue', variant: 'secondary' },
      [IssueStatus.WAITING_APPROVAL]: { label: 'Waiting Verification', variant: 'secondary' },
      [IssueStatus.CLOSE]: { label: 'Closed', variant: 'default' },
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
        title="Inspection Item Details"
        subtitle="View detailed information about this inspection item"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/inspections/items')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Inspection Items
            </Button>
            <Button onClick={() => navigate(`/inspections/items/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
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
                <p className="text-sm font-medium text-muted-foreground">Risk Category</p>
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

        <Card>
          <CardHeader>
            <CardTitle>Risk Mitigation</CardTitle>
          </CardHeader>
          <CardContent>
            {item.mitigation ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Eliminate</p>
                  <p className="text-sm whitespace-pre-wrap">{item.mitigation.eliminate || 'N/A'}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Transfer</p>
                  <p className="text-sm whitespace-pre-wrap">{item.mitigation.transfer || 'N/A'}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Reduce</p>
                  <p className="text-sm whitespace-pre-wrap">{item.mitigation.reduce || 'N/A'}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Accept</p>
                  <p className="text-sm whitespace-pre-wrap">{item.mitigation.accept || 'N/A'}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Legal Aspect</p>
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
