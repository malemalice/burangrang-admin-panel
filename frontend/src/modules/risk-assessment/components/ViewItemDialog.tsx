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
import { RiskAssessmentItem } from '@/core/lib/types';
import { getRiskBadge } from '../utils/riskBadgeHelpers';

interface ViewItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: RiskAssessmentItem | null;
}

export const ViewItemDialog = ({ open, onOpenChange, item }: ViewItemDialogProps) => {
  // Convert likelihood numeric to alphabet (1 -> A, 2 -> B, 3 -> C, etc.)
  const getLikelihoodLetter = (level: number): string => {
    if (!level || level < 1) return 'N/A';
    return String.fromCharCode(64 + level); // 1 -> A, 2 -> B, 3 -> C, etc.
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Risk Assessment Item Details</DialogTitle>
          <DialogDescription>
            View detailed information about this risk assessment item.
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
                  {item.mRiskCategory
                    ? `${item.mRiskCategory.code} - ${item.mRiskCategory.name}`
                    : 'N/A'}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Risk</p>
                <p className="text-sm">
                  {item.mRisk
                    ? `${item.mRisk.code} - ${item.mRisk.name}`
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Pre-Control Assessment */}
          <div>
            <h3 className="text-lg font-medium mb-4">Pre-Control Assessment</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Likelihood</p>
                <p className="text-sm">{getLikelihoodLetter(item.likelihoodLevel)}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Consequence</p>
                <p className="text-sm">{item.consequenceLevel}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Risk Rating</p>
                <div>{getRiskBadge(item.riskMatrixRating)}</div>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Interpretation</p>
                <div>{getRiskBadge(item.interpretation)}</div>
              </div>
            </div>
          </div>

          {/* Risk Mitigation - Show stored mitigation data */}
          {item.mitigation && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-medium mb-4">Risk Mitigation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {item.mitigation.eliminate && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Eliminate</p>
                      <div className="p-3 rounded-md border bg-card text-card-foreground">
                        <p className="text-sm whitespace-pre-wrap">{item.mitigation.eliminate}</p>
                      </div>
                    </div>
                  )}
                  {item.mitigation.transfer && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Transfer</p>
                      <div className="p-3 rounded-md border bg-card text-card-foreground">
                        <p className="text-sm whitespace-pre-wrap">{item.mitigation.transfer}</p>
                      </div>
                    </div>
                  )}
                  {item.mitigation.reduce && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Reduce</p>
                      <div className="p-3 rounded-md border bg-card text-card-foreground">
                        <p className="text-sm whitespace-pre-wrap">{item.mitigation.reduce}</p>
                      </div>
                    </div>
                  )}
                  {item.mitigation.accept && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Accept</p>
                      <div className="p-3 rounded-md border bg-card text-card-foreground">
                        <p className="text-sm whitespace-pre-wrap">{item.mitigation.accept}</p>
                      </div>
                    </div>
                  )}
                  {!item.mitigation.eliminate && 
                   !item.mitigation.transfer && 
                   !item.mitigation.reduce && 
                   !item.mitigation.accept && (
                    <div className="text-center py-8 text-sm text-muted-foreground col-span-2">
                      No risk mitigation data available for this item.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Post-Control Assessment */}
          <div>
            <h3 className="text-lg font-medium mb-4">Post-Control Assessment</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Post Likelihood</p>
                <p className="text-sm">{getLikelihoodLetter(item.postLikelihoodLevel)}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Post Consequence</p>
                <p className="text-sm">{item.postConsequenceLevel}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Post Risk Rating</p>
                <div>{getRiskBadge(item.postRiskMatrixRating)}</div>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Post Interpretation</p>
                <div>{getRiskBadge(item.postInterpretation)}</div>
              </div>
            </div>
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
