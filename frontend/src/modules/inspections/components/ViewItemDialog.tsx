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
              {item.description && (
                <div className="space-y-1.5 md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm whitespace-pre-wrap">{item.description}</p>
                </div>
              )}
            </div>
          </div>

          {item.followUpNotes && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-medium mb-4">Follow-up Notes</h3>
                <div className="p-3 rounded-md border bg-card text-card-foreground">
                  <p className="text-sm whitespace-pre-wrap">{item.followUpNotes}</p>
                </div>
              </div>
            </>
          )}

          {item.images && item.images.length > 0 && (
            <>
              <Separator />
              <div className="space-y-6">
                {/* Before Images */}
                {item.images.filter(img => img.type === InspectionImageTypeEnum.BEFORE).length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">
                      Before Images (Current Condition) ({item.images.filter(img => img.type === InspectionImageTypeEnum.BEFORE).length})
                    </h3>
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
                  </div>
                )}

                {/* After Images */}
                {item.images.filter(img => img.type === InspectionImageTypeEnum.AFTER).length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">
                      After Images (After Fix/Action Plan) ({item.images.filter(img => img.type === InspectionImageTypeEnum.AFTER).length})
                    </h3>
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
                  </div>
                )}

                {/* General Images (if any) */}
                {item.images.filter(img => img.type === InspectionImageTypeEnum.GENERAL || !img.type).length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">
                      General Images ({item.images.filter(img => img.type === InspectionImageTypeEnum.GENERAL || !img.type).length})
                    </h3>
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
                  </div>
                )}
              </div>
            </>
          )}
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

