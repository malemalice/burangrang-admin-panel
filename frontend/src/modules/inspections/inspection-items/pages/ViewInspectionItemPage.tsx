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
import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';

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

  const getStatusBadge = (status: GeneralStatusEnum) => {
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
          <Button onClick={() => navigate(`/inspections/items/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        }
      >
        <Button
          variant="ghost"
          onClick={() => navigate('/inspections/items')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Inspection Items
        </Button>
      </PageHeader>

      <div className="max-w-4xl space-y-6">
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

        {item.description && (
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{item.description}</p>
            </CardContent>
          </Card>
        )}

        {item.followUpNotes && (
          <Card>
            <CardHeader>
              <CardTitle>Follow-up Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 rounded-md border bg-card text-card-foreground">
                <p className="text-sm whitespace-pre-wrap">{item.followUpNotes}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {item.images && item.images.length > 0 && (
          <>
            {/* Before Images */}
            {item.images.filter(img => img.type === InspectionImageTypeEnum.BEFORE).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Before Images (Current Condition) ({item.images.filter(img => img.type === InspectionImageTypeEnum.BEFORE).length})</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            )}

            {/* After Images */}
            {item.images.filter(img => img.type === InspectionImageTypeEnum.AFTER).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>After Images (After Fix/Action Plan) ({item.images.filter(img => img.type === InspectionImageTypeEnum.AFTER).length})</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            )}

            {/* General Images (if any) */}
            {item.images.filter(img => img.type === InspectionImageTypeEnum.GENERAL || !img.type).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>General Images ({item.images.filter(img => img.type === InspectionImageTypeEnum.GENERAL || !img.type).length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {item.images
                      .filter(img => img.type === InspectionImageTypeEnum.GENERAL || !img.type)
                      .map((image) => (
                        <div key={image.id} className="space-y-2">
                          <img
                            src={image.imageUrl}
                            alt={image.caption || 'Inspection image'}
                            className="w-full h-32 object-cover rounded-md border"
                          />
                          {image.caption && (
                            <p className="text-xs text-muted-foreground">{image.caption}</p>
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default ViewInspectionItemPage;
