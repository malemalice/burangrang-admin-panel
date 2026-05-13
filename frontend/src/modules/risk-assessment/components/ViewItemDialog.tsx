import { useState } from 'react';
import { Info } from 'lucide-react';
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
import { RiskMatrixReferenceDialog } from './RiskMatrixReferenceDialog';

interface ViewItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: RiskAssessmentItem | null;
}

export const ViewItemDialog = ({ open, onOpenChange, item }: ViewItemDialogProps) => {
  const [riskMatrixOpen, setRiskMatrixOpen] = useState(false);

  if (!item) return null;

  return (
    <>
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
                <p className="text-sm font-medium text-muted-foreground">Type of Hazard</p>
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
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-medium">Pre-Control Assessment</h3>
              <button
                type="button"
                onClick={() => setRiskMatrixOpen(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="View risk matrix reference"
              >
                <Info className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Likelihood</p>
                <p className="text-sm">{item.likelihoodLevel || 'N/A'}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Consequence</p>
                <p className="text-sm">{item.consequenceLevel}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Risk Matrix Rating</p>
                <div className="flex items-center gap-2">
                  {item.riskMatrixRating ? (
                    <>
                      <span className="inline-flex items-center rounded-md border border-input bg-muted px-2 py-1 text-sm font-medium font-mono">
                        {item.riskMatrixRating}
                      </span>
                    </>
                  ) : (
                    'N/A'
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Interpretation</p>
                <div>{getRiskBadge(item.interpretation)}</div>
              </div>
            </div>
          </div>

          {/* Risk Mitigation - Show all fields even if null */}
          <Separator />
          <div>
            <h3 className="text-lg font-medium mb-4">Risk Mitigation</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Elimination Control</p>
                <div className="p-3 rounded-md border bg-card text-card-foreground">
                  <p className="text-sm whitespace-pre-wrap">
                    {item.mitigation?.eliminationControl || 'N/A'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Substitution Control</p>
                <div className="p-3 rounded-md border bg-card text-card-foreground">
                  <p className="text-sm whitespace-pre-wrap">
                    {item.mitigation?.substitutionControl || 'N/A'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Engineering Control</p>
                <div className="p-3 rounded-md border bg-card text-card-foreground">
                  <p className="text-sm whitespace-pre-wrap">
                    {item.mitigation?.engineeringControl || 'N/A'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Administration Control</p>
                <div className="p-3 rounded-md border bg-card text-card-foreground">
                  <p className="text-sm whitespace-pre-wrap">
                    {item.mitigation?.administrationControl || 'N/A'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Personal Protective Equipment</p>
                <div className="p-3 rounded-md border bg-card text-card-foreground">
                  <p className="text-sm whitespace-pre-wrap">
                    {item.mitigation?.personalProtectiveEquipment || 'N/A'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Transfer</p>
                <div className="p-3 rounded-md border bg-card text-card-foreground">
                  <p className="text-sm whitespace-pre-wrap">
                    {item.mitigation?.transfer || 'N/A'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Accept</p>
                <div className="p-3 rounded-md border bg-card text-card-foreground">
                  <p className="text-sm whitespace-pre-wrap">
                    {item.mitigation?.accept || 'N/A'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Legal Aspect & Standard reference</p>
                <div className="p-3 rounded-md border bg-card text-card-foreground">
                  <p className="text-sm whitespace-pre-wrap">
                    {item.mitigation?.legalAspect || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Post-Control Assessment */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-medium">Post-Control Assessment</h3>
              <button
                type="button"
                onClick={() => setRiskMatrixOpen(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="View risk matrix reference"
              >
                <Info className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Post Likelihood</p>
                <p className="text-sm">{item.postLikelihoodLevel || 'N/A'}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Post Consequence</p>
                <p className="text-sm">{item.postConsequenceLevel}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Post Risk Matrix Rating</p>
                <div className="flex items-center gap-2">
                  {item.postRiskMatrixRating ? (
                    <>
                      <span className="inline-flex items-center rounded-md border border-input bg-muted px-2 py-1 text-sm font-medium font-mono">
                        {item.postRiskMatrixRating}
                      </span>
                    </>
                  ) : (
                    'N/A'
                  )}
                </div>
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
    <RiskMatrixReferenceDialog open={riskMatrixOpen} onOpenChange={setRiskMatrixOpen} />
    </>
  );
};
