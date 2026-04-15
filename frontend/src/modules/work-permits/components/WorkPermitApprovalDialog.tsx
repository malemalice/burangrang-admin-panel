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
import { toast } from 'sonner';
import workPermitService from '../services/workPermitService';

function getErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('response' in error)) return undefined;
  const data = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data;
  const msg = data?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  if (typeof msg === 'string') return msg;
  return undefined;
}

interface WorkPermitApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workPermitId: string;
  /** Current permit status — used to show HSE Safety Guideline (SK) field when approving at HSE step */
  workPermitStatus: string | undefined;
  onSubmitted: () => void | Promise<void>;
  initialStatus?: ApprovalStatus;
}

export const WorkPermitApprovalDialog = ({
  open,
  onOpenChange,
  workPermitId,
  workPermitStatus,
  onSubmitted,
  initialStatus = ApprovalStatus.APPROVED,
}: WorkPermitApprovalDialogProps) => {
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(initialStatus);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [safetyGuideline, setSafetyGuideline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isHseApprove = workPermitStatus === 'IN_REVIEW_HSE' && approvalStatus === ApprovalStatus.APPROVED;

  useEffect(() => {
    if (open) {
      setApprovalStatus(initialStatus);
      setApprovalNotes('');
      setSafetyGuideline('');
    }
  }, [open, initialStatus]);

  const handleSubmit = async () => {
    if (!workPermitId) return;

    const trimmedNotes = approvalNotes.trim();
    if (approvalStatus === ApprovalStatus.REJECTED && !trimmedNotes) {
      toast.error('Notes are required when rejecting');
      return;
    }

    try {
      setIsSubmitting(true);
      if (approvalStatus === ApprovalStatus.APPROVED) {
        await workPermitService.approveWorkPermit(workPermitId, {
          ...(trimmedNotes ? { notes: trimmedNotes } : {}),
          ...(isHseApprove && safetyGuideline.trim() ? { safetyGuideline: safetyGuideline.trim() } : {}),
        });
        toast.success('Work permit approved successfully');
      } else {
        await workPermitService.rejectWorkPermit(workPermitId, trimmedNotes);
        toast.success('Work permit rejected');
      }
      onOpenChange(false);
      setApprovalNotes('');
      setSafetyGuideline('');
      await onSubmitted();
    } catch (error) {
      toast.error(getErrorMessage(error) ?? 'Failed to submit approval');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Approval</DialogTitle>
          <DialogDescription>Review and submit your approval for this work permit.</DialogDescription>
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
                <RadioGroupItem value={ApprovalStatus.APPROVED} id="wp-approved" />
                <Label htmlFor="wp-approved" className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Approve
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={ApprovalStatus.REJECTED} id="wp-rejected" />
                <Label htmlFor="wp-rejected" className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Reject
                </Label>
              </div>
            </RadioGroup>
          </div>

          {isHseApprove && (
            <div className="space-y-2">
              <Label htmlFor="wp-sk">Safety Guideline (SK)</Label>
              <Textarea
                id="wp-sk"
                placeholder="Write safety terms and conditions for applicant acknowledgment..."
                value={safetyGuideline}
                onChange={(e) => setSafetyGuideline(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="wp-notes">
              Notes
              {approvalStatus === ApprovalStatus.REJECTED && <span className="text-red-500"> *</span>}
            </Label>
            <Textarea
              id="wp-notes"
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
            disabled={
              isSubmitting || (approvalStatus === ApprovalStatus.REJECTED && !approvalNotes.trim())
            }
          >
            {isSubmitting ? 'Submitting...' : 'Submit Approval'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
