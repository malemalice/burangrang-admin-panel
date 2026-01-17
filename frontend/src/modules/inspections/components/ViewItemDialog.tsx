import { format } from 'date-fns';
import { Button } from '@/core/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Separator } from '@/core/components/ui/separator';
import { InspectionItem, InspectionImageTypeEnum } from '../types/inspection.types';
import { getStatusBadge } from '../utils/inspectionBadgeHelpers';

interface ViewItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InspectionItem | null;
}

export const ViewItemDialog = ({ open, onOpenChange, item }: ViewItemDialogProps) => {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inspection Item Details</DialogTitle>
          <DialogDescription>
            View detailed information about this inspection item.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  {item.riskCategory
                    ? item.riskCategory.name
                    : item.riskCategoryId || 'N/A'}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Risk</p>
                <p className="text-sm">
                  {item.risk
                    ? item.risk.name
                    : item.riskId || 'N/A'}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Assigned Department</p>
                <p className="text-sm">
                  {item.assignedDepartment
                    ? item.assignedDepartment.name
                    : item.assignedDepartmentId || 'N/A'}
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
              <div className="space-y-1.5 md:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-sm whitespace-pre-wrap">{item.description || 'N/A'}</p>
              </div>
            </div>
          </div>

          <Separator />
          <div>
            <h3 className="text-lg font-medium mb-4">Findings</h3>
            <p className="text-sm whitespace-pre-wrap">{item.findings || 'N/A'}</p>
          </div>

          <Separator />
          <div>
            <h3 className="text-lg font-medium mb-4">Follow-up Notes</h3>
            <div className="p-3 rounded-md border bg-card text-card-foreground">
              <p className="text-sm whitespace-pre-wrap">{item.followUpNotes || 'N/A'}</p>
            </div>
          </div>

          <Separator />
          <div>
            <h3 className="text-lg font-medium mb-4">Images</h3>
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
          </div>

          <Separator />
          <div>
            <h3 className="text-lg font-medium mb-4">Risk Mitigation</h3>
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
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

