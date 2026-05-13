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
import { InspectionRiskRateEnum, INSPECTION_RISK_RATE_OPTIONS, INSPECTION_RISK_RATE_BADGE_CLASSES } from '@/shared/constants/inspection-risk-rate.enum';

const getRiskRateLabel = (rate?: InspectionRiskRateEnum) =>
  INSPECTION_RISK_RATE_OPTIONS.find((o) => o.value === rate)?.label ?? rate ?? '—';

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
          <DialogTitle>Inspection Finding Monitoring Details</DialogTitle>
          <DialogDescription>
            View detailed information about this Inspection Finding Monitoring.
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
                <p className="text-sm font-medium text-muted-foreground">Type of Hazard</p>
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
            <h3 className="text-lg font-medium mb-4">Checklist Results</h3>
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2 mb-4">
              <p className="font-medium text-sm">Rating Legend</p>
              <div className="space-y-1">
                {[
                  { color: 'border-green-500', label: 'Safe', labelColor: 'text-green-700', desc: 'No risk of incidents.' },
                  { color: 'border-yellow-500', label: 'Low Hazard', labelColor: 'text-yellow-700', desc: 'Risk of an incident occurring without a lost-time injury (the injured person can still continue the activity).' },
                  { color: 'border-orange-500', label: 'Moderate Hazard', labelColor: 'text-orange-700', desc: 'Risk of an incident occurring with a lost-time injury (the injured person cannot continue the activity).' },
                  { color: 'border-red-500', label: 'Critical Hazard', labelColor: 'text-red-700', desc: 'Risk of an incident occurring with a lost-time injury that could result in death or permanent disability, or cause large and extensive environmental damage, and lead to the stoppage of work processes/activities.' },
                ].map(({ color, label, labelColor, desc }) => (
                  <div key={label} className={`flex items-center gap-3 border-l-4 ${color} pl-3 py-1`}>
                    <span className={`w-32 shrink-0 text-xs font-semibold ${labelColor}`}>{label}</span>
                    <span className="text-xs text-muted-foreground">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
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
                                {getRiskRateLabel(result.riskRate)}
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
          </div>

          <Separator />
          <div>
            <h3 className="text-lg font-medium mb-4">Risk Mitigation</h3>
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

