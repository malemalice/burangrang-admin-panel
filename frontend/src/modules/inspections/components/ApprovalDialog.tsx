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
import { approvalService, APPROVAL_ENTITIES } from '@/modules/master-data';
import { toast } from 'sonner';

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspectionId: string;
  onApprovalSubmitted: () => void;
  initialStatus?: ApprovalStatus;
}

export const ApprovalDialog = ({ 
  open, 
  onOpenChange, 
  inspectionId,
  onApprovalSubmitted,
  initialStatus = ApprovalStatus.APPROVED,
}: ApprovalDialogProps) => {
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(initialStatus);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens or initialStatus changes
  useEffect(() => {
    if (open) {
      setApprovalStatus(initialStatus);
      setApprovalNotes('');
    }
  }, [open, initialStatus]);

  const handleSubmit = async () => {
    if (!inspectionId) return;

    try {
      setIsSubmitting(true);
      await approvalService.submitApproval({
        dataId: inspectionId,
        entity: APPROVAL_ENTITIES.INSPECTION,
        status: approvalStatus,
        notes: approvalNotes,
      });

      toast.success('Approval submitted successfully');
      onOpenChange(false);
      setApprovalNotes('');
      onApprovalSubmitted();
    } catch (error) {
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
            Review and submit your approval for this inspection.
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
                <RadioGroupItem value={ApprovalStatus.APPROVED} id="approved" />
                <Label htmlFor="approved" className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Approve
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={ApprovalStatus.REJECTED} id="rejected" />
                <Label htmlFor="rejected" className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Reject
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Enter your approval notes..."
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !approvalNotes.trim()}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Approval'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

