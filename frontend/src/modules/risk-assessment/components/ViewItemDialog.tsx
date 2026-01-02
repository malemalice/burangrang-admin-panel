import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
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
import riskMitigationService, { type RiskMitigation } from '../services/riskMitigationService';

interface ViewItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: RiskAssessmentItem | null;
}

export const ViewItemDialog = ({ open, onOpenChange, item }: ViewItemDialogProps) => {
  const [riskMitigations, setRiskMitigations] = useState<RiskMitigation[]>([]);
  const [isLoadingRiskMitigations, setIsLoadingRiskMitigations] = useState(false);

  // Convert likelihood numeric to alphabet (1 -> A, 2 -> B, 3 -> C, etc.)
  const getLikelihoodLetter = (level: number): string => {
    if (!level || level < 1) return 'N/A';
    return String.fromCharCode(64 + level); // 1 -> A, 2 -> B, 3 -> C, etc.
  };

  useEffect(() => {
    if (open && item?.mRiskId) {
      setIsLoadingRiskMitigations(true);
      riskMitigationService.getByRiskId(item.mRiskId)
        .then((mitigations) => {
          setRiskMitigations(mitigations);
        })
        .catch((error) => {
          console.error('Failed to fetch risk mitigations:', error);
          setRiskMitigations([]);
        })
        .finally(() => {
          setIsLoadingRiskMitigations(false);
        });
    } else {
      setRiskMitigations([]);
    }
  }, [open, item?.mRiskId]);

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

          {/* Risk Mitigation Options */}
          {item.mRiskId && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-medium mb-4">Risk Mitigation Options</h3>
                {isLoadingRiskMitigations ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading risk mitigation options...</span>
                    </div>
                  </div>
                ) : riskMitigations.length > 0 ? (
                  <div className="space-y-4">
                    {riskMitigations.map((mitigation) => (
                      <div key={mitigation.id} className="space-y-4">
                        {mitigation.eliminate && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Eliminate</p>
                            <div className="p-3 rounded-md border bg-card text-card-foreground">
                              <p className="text-sm">{mitigation.eliminate}</p>
                            </div>
                          </div>
                        )}
                        {mitigation.transfer && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Transfer</p>
                            <div className="p-3 rounded-md border bg-card text-card-foreground">
                              <p className="text-sm">{mitigation.transfer}</p>
                            </div>
                          </div>
                        )}
                        {mitigation.reduce && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Reduce</p>
                            <div className="p-3 rounded-md border bg-card text-card-foreground">
                              <p className="text-sm">{mitigation.reduce}</p>
                            </div>
                          </div>
                        )}
                        {mitigation.accept && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Accept</p>
                            <div className="p-3 rounded-md border bg-card text-card-foreground">
                              <p className="text-sm">{mitigation.accept}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No risk mitigation options available for the selected risk.
                  </div>
                )}
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
