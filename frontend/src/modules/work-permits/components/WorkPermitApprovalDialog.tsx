import { useState, useEffect, useMemo } from 'react';
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
import { courseService, type Course } from '@/modules/courses';
import type { WorkClassificationMasterOption } from '../types/work-permit.types';
import { WorkPermitSafetyGuidelineSection, type SafetyGuidanceBlock } from './WorkPermitSafetyGuidelineSection';
import { WorkPermitHseSectionFReview, type HseRequiredCourseDraft } from './WorkPermitHseSectionFReview';

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
  const [courses, setCourses] = useState<Course[]>([]);
  const [requireCourseVerification, setRequireCourseVerification] = useState(false);
  const [requiredCoursesDraft, setRequiredCoursesDraft] = useState<HseRequiredCourseDraft[]>([]);

  const isHseApprove = workPermitStatus === 'IN_REVIEW_HSE' && approvalStatus === ApprovalStatus.APPROVED;

  const courseOptions = useMemo(
    () => courses.map((c) => ({ value: c.id, label: c.title ?? c.slug ?? c.id })),
    [courses],
  );

  useEffect(() => {
    if (open) {
      setApprovalStatus(initialStatus);
      setApprovalNotes('');
      setGuidanceBlocks([]);
      setRequireCourseVerification(false);
      setRequiredCoursesDraft([]);
      setCourses([]);
    }
  }, [open, initialStatus]);

  useEffect(() => {
    if (!open || !isHseApprove || !workPermitId) return;
    let cancelled = false;
    (async () => {
      setLoadingHse(true);
      try {
        const wpPromise = workPermitService.getWorkPermitById(workPermitId);
        const coursesPromise = courseService.getCourses({ page: 1, limit: 100, isActive: true });

        const [wp, md, risksRes, seRes, coursesRes] = await Promise.all([
          wpPromise,
          workPermitService.getMasterData(),
          riskService.getAll({ page: 1, limit: 500, isActive: true, options: true }),
          safetyEquipmentService.getSafetyEquipments({ page: 1, limit: 100 }),
          coursesPromise,
        ]);
        if (cancelled) return;
        setWorkClassifications(md.workClassifications);
        setRisks((risksRes.data ?? []).map((r) => ({ id: r.id, name: r.name, code: r.code })));
        setSafetyEquipment(seRes.data ?? []);
        setCourses(coursesRes.data);
        setRequireCourseVerification(wp.requireCourseVerification ?? false);
        setRequiredCoursesDraft(
          (wp.requiredCourses ?? []).map((c) => ({
            courseId: c.courseId,
            order: c.order,
          })),
        );
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
        toast.error('Failed to load HSE review data');
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

    if (
      approvalStatus === ApprovalStatus.APPROVED &&
      isHseApprove &&
      requireCourseVerification
    ) {
      const filled = requiredCoursesDraft.filter((r) => r.courseId);
      if (filled.length === 0) {
        toast.error('Add at least one required course, or turn off course verification.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      if (approvalStatus === ApprovalStatus.APPROVED) {
        const hseSectionF =
          isHseApprove
            ? {
                requireCourseVerification,
                requiredCourses: requireCourseVerification
                  ? requiredCoursesDraft
                      .filter((r) => r.courseId)
                      .map((r, i) => ({
                        courseId: r.courseId,
                        isRequired: true,
                        order: i,
                      }))
                  : [],
              }
            : {};

        await workPermitService.approveWorkPermit(workPermitId, {
          ...(trimmedNotes ? { notes: trimmedNotes } : {}),
          ...hseSectionF,
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
          <DialogTitle>{isHseApprove ? 'HSE review & approval' : 'Submit approval'}</DialogTitle>
          <DialogDescription>
            {isHseApprove
              ? 'Complete Section F and Section G safety guideline, then approve or reject.'
              : 'Review and submit your approval for this work permit.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isHseApprove && (
            <div className="rounded-lg border border-dashed border-primary/40 bg-muted/40 p-4 space-y-4">
              {loadingHse ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading HSE review…
                </div>
              ) : (
                <>
                  <WorkPermitHseSectionFReview
                    requireCourseVerification={requireCourseVerification}
                    onRequireCourseVerificationChange={setRequireCourseVerification}
                    requiredCourses={requiredCoursesDraft}
                    onRequiredCoursesChange={setRequiredCoursesDraft}
                    courseOptions={courseOptions}
                  />
                  <div className="space-y-2 pt-2 border-t">
                    <div>
                      <p className="text-sm font-medium">G. Safety Guideline</p>
                      <p className="text-xs text-muted-foreground">
                        Review and adjust risk, safety equipment, and mitigation rows.
                      </p>
                    </div>
                    <WorkPermitSafetyGuidelineSection
                      blocks={guidanceBlocks}
                      onChange={setGuidanceBlocks}
                      workClassifications={workClassifications}
                      risks={risks}
                      safetyEquipment={safetyEquipment}
                      hideGuidelineNarrative
                      embedded
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Approval decision</Label>
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
              isSubmitting ||
              (approvalStatus === ApprovalStatus.REJECTED && !approvalNotes.trim()) ||
              (isHseApprove && loadingHse)
            }
          >
            {isSubmitting ? 'Submitting...' : 'Submit Approval'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
