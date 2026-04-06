import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Label } from '@/core/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/core/components/ui/radio-group';
import { Textarea } from '@/core/components/ui/textarea';
import { ApprovalStatus } from '@/core/lib/types';
import approvalService from '@/modules/master-data/services/approvalService';
import { APPROVAL_ENTITIES } from '@/shared/constants/approval-entity.constants';
import { toast } from 'sonner';

type ApprovalDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprovalSubmitted: () => void;
  initialStatus?: ApprovalStatus;
} & (
  | { weightReportId: string; dispatchOrderId?: never }
  | { dispatchOrderId: string; weightReportId?: never }
);

export const ApprovalDialog = ({
  open,
  onOpenChange,
  onApprovalSubmitted,
  initialStatus = ApprovalStatus.APPROVED,
  ...rest
}: ApprovalDialogProps) => {
  const dataId = 'weightReportId' in rest ? rest.weightReportId : rest.dispatchOrderId;
  const entity =
    'weightReportId' in rest ? APPROVAL_ENTITIES.WEIGHT_REPORT : APPROVAL_ENTITIES.DISPATCH_ORDER;
  const idPrefix = 'weightReportId' in rest ? 'wr' : 'do';
  const subjectLabel =
    'weightReportId' in rest ? 'this weight report' : 'this dispatch order';

  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(initialStatus);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setApprovalStatus(initialStatus);
      setApprovalNotes('');
    }
  }, [open, initialStatus]);

  const handleSubmit = async () => {
    if (!dataId) return;

    try {
      setIsSubmitting(true);
      await approvalService.submitApproval({
        dataId,
        entity,
        status: approvalStatus,
        notes: approvalNotes,
      });

      toast.success('Approval submitted successfully');
      onOpenChange(false);
      setApprovalNotes('');
      onApprovalSubmitted();
    } catch {
      toast.error('Failed to submit approval');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Approval</DialogTitle>
          <DialogDescription>
            Review and submit your approval decision for {subjectLabel}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Approval Status</Label>
            <RadioGroup
              value={approvalStatus}
              onValueChange={(value) => setApprovalStatus(value as ApprovalStatus)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={ApprovalStatus.APPROVED} id={`${idPrefix}-approved`} />
                <Label htmlFor={`${idPrefix}-approved`} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Approve
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={ApprovalStatus.REJECTED} id={`${idPrefix}-rejected`} />
                <Label htmlFor={`${idPrefix}-rejected`} className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Reject
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-notes`}>
              Notes{approvalStatus === ApprovalStatus.REJECTED && <span className="text-red-500"> *</span>}
            </Label>
            <Textarea
              id={`${idPrefix}-notes`}
              placeholder={
                approvalStatus === ApprovalStatus.REJECTED
                  ? 'Enter reason for rejection...'
                  : 'Enter your approval notes (optional)...'
              }
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (approvalStatus === ApprovalStatus.REJECTED && !approvalNotes.trim())}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Approval'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
