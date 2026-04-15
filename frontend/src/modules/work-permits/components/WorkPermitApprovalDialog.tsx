import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
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
import { riskService } from '@/modules/master-data';
import { safetyEquipmentService, type SafetyEquipment } from '@/modules/ppe';
import type { WorkClassificationMasterOption } from '../types/work-permit.types';
import { WorkPermitSafetyGuidelineSection, type SafetyGuidanceBlock } from './WorkPermitSafetyGuidelineSection';

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
  /** Current permit status — used to show HSE Safety Guideline editor when approving at HSE step */
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingHse, setLoadingHse] = useState(false);
  const [guidanceBlocks, setGuidanceBlocks] = useState<SafetyGuidanceBlock[]>([]);
  const [workClassifications, setWorkClassifications] = useState<WorkClassificationMasterOption[]>([]);
  const [risks, setRisks] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [safetyEquipment, setSafetyEquipment] = useState<SafetyEquipment[]>([]);

  const isHseApprove = workPermitStatus === 'IN_REVIEW_HSE' && approvalStatus === ApprovalStatus.APPROVED;

  useEffect(() => {
    if (open) {
      setApprovalStatus(initialStatus);
      setApprovalNotes('');
      setGuidanceBlocks([]);
    }
  }, [open, initialStatus]);

  useEffect(() => {
    if (!open || !isHseApprove || !workPermitId) return;
    let cancelled = false;
    (async () => {
      setLoadingHse(true);
      try {
        const [wp, md, risksRes, seRes] = await Promise.all([
          workPermitService.getWorkPermitById(workPermitId),
          workPermitService.getMasterData(),
          riskService.getAll({ page: 1, limit: 500, isActive: true, options: true }),
          safetyEquipmentService.getSafetyEquipments({ page: 1, limit: 100 }),
        ]);
        if (cancelled) return;
        setWorkClassifications(md.workClassifications);
        setRisks((risksRes.data ?? []).map((r) => ({ id: r.id, name: r.name, code: r.code })));
        setSafetyEquipment(seRes.data ?? []);
        setGuidanceBlocks(
          (wp.classifications ?? []).map((c) => ({
            workPermitClassificationId: c.id,
            workClassificationId: c.workClassificationId,
            order: c.order,
            safetyGuidelineSnapshot: c.safetyGuidelineSnapshot ?? null,
            rows: (c.safetyGuidanceRows ?? []).map((r) => ({
              riskId: r.riskId,
              safetyEquipmentId: r.safetyEquipmentId,
              notes: r.notes ?? undefined,
              order: r.order,
            })),
          })),
        );
      } catch (e) {
        console.error(e);
        toast.error('Failed to load safety guidance for editing');
      } finally {
        if (!cancelled) setLoadingHse(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, isHseApprove, workPermitId]);

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
          ...(isHseApprove
            ? {
                classificationSafetyGuidance: guidanceBlocks.map((b) => ({
                  workPermitClassificationId: b.workPermitClassificationId!,
                  safetyGuidelineSnapshot: b.safetyGuidelineSnapshot,
                  rows: b.rows.map((r, i) => ({ ...r, order: r.order ?? i })),
                })),
              }
            : {}),
        });
        toast.success('Work permit approved successfully');
      } else {
        await workPermitService.rejectWorkPermit(workPermitId, trimmedNotes);
        toast.success('Work permit rejected');
      }
      onOpenChange(false);
      setApprovalNotes('');
      await onSubmitted();
    } catch (error) {
      toast.error(getErrorMessage(error) ?? 'Failed to submit approval');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
              {loadingHse ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading safety guidance…
                </div>
              ) : (
                <WorkPermitSafetyGuidelineSection
                  blocks={guidanceBlocks}
                  onChange={setGuidanceBlocks}
                  workClassifications={workClassifications}
                  risks={risks}
                  safetyEquipment={safetyEquipment}
                />
              )}
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
