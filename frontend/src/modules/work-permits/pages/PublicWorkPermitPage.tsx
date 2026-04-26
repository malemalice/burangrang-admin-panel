import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { ClipboardList, PenLine } from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Separator } from '@/core/components/ui/separator';
import { Textarea } from '@/core/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import workPermitService from '../services/workPermitService';
import type { UpdateWorkPermitDTO, WorkPermit } from '../types/work-permit.types';
import { PublicWorkPermitReadOnlyDetail } from '../components/PublicWorkPermitReadOnlyDetail';
import { WorkPermitSafetyGuidelineDisplay } from '../components/WorkPermitSafetyGuidelineDisplay';
import { WorkPermitSection, WorkPermitSubsectionTitle } from '../components/WorkPermitSection';
import { WORK_PERMIT_SECTION_G_SUB } from '../constants/workPermitSections';
import { useWorkPermitClassificationContentEnabled } from '../hooks/useWorkPermitClassificationContentEnabled';
import { useWorkPermitClassificationRiskMitigations } from '../hooks/useWorkPermitClassificationRiskMitigations';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import { PublicAppModuleHeader } from '@/core/components/layout/PublicAppModuleHeader';
import type { RiskMitigation } from '@/modules/risk-assessment/services/riskMitigationService';
import type {
  PublicWorkPermitCourseAssignee,
  PublicWorkPermitCourseVerification,
  WorkPermitPublicApplicantPhase,
} from '../types/work-permit.types';

const PUBLIC_WORK_PERMIT_MODULE_TITLE = 'Work permit (public)';
const PUBLIC_WORK_PERMIT_MODULE_DESC =
  'Complete or view this work permit using the secure link from your organization. You do not need to sign in.';

function getErrorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as { message?: string | string[] } | undefined;
    const m = data?.message;
    if (Array.isArray(m)) return m.join(', ');
    if (typeof m === 'string') return m;
  }
  if (e instanceof Error) return e.message;
  return 'Something went wrong';
}

const displayField = (v: string | number | boolean | null | undefined) => {
  if (v == null) return '—';
  const s = String(v).trim();
  return s !== '' ? s : '—';
};

function assigneeSourceLabel(source: PublicWorkPermitCourseAssignee['source']): string {
  if (source === 'applicant') return 'Applicant';
  if (source === 'worker') return 'Worker';
  return 'Employee';
}

type HazardDraft = {
  hazardId?: string;
  hazardName: string;
  activity?: string;
  mitigation?: string;
};

type AttachmentDraft = {
  fileUrl: string;
  fileName: string;
  fileType?: string;
  description?: string;
};

const PublicWorkPermitPage = () => {
  const { token: tokenParam } = useParams<{ token: string }>();
  const token = tokenParam ? decodeURIComponent(tokenParam) : '';

  const [workPermit, setWorkPermit] = useState<WorkPermit | null>(null);
  const [applicantPhase, setApplicantPhase] = useState<WorkPermitPublicApplicantPhase | null>(null);
  const [canEditDraft, setCanEditDraft] = useState(false);
  const [canSignSk, setCanSignSk] = useState(false);
  const [canSignSkAction, setCanSignSkAction] = useState(false);
  const [courseVerification, setCourseVerification] = useState<PublicWorkPermitCourseVerification | null>(null);
  const [mitigationsByRiskIdPrefetch, setMitigationsByRiskIdPrefetch] = useState<
    Record<string, RiskMitigation[]> | undefined
  >(undefined);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signSkDialogOpen, setSignSkDialogOpen] = useState(false);
  const [applicantSignature, setApplicantSignature] = useState('');
  const [signingSk, setSigningSk] = useState(false);

  const { enabled: classificationContentEnabled } = useWorkPermitClassificationContentEnabled();
  const {
    mitigationsByRiskId,
    mitigationsLoadingByRiskId,
    mitigationsErrorByRiskId,
  } = useWorkPermitClassificationRiskMitigations(
    workPermit?.classifications,
    mitigationsByRiskIdPrefetch,
  );

  // Minimal editable fields (avoid depending on authenticated master-data endpoints).
  const [projectName, setProjectName] = useState('');
  const [proposedStartDate, setProposedStartDate] = useState('');
  const [proposedEndDate, setProposedEndDate] = useState('');
  const [workStagesDescription, setWorkStagesDescription] = useState('');
  const [jobSafetyAnalysis, setJobSafetyAnalysis] = useState('');
  const [workRequirements, setWorkRequirements] = useState('');
  const [workClassificationOtherDetail, setWorkClassificationOtherDetail] = useState('');
  const [hazards, setHazards] = useState<HazardDraft[]>([]);
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);

  const isApplicantActionPhase = canEditDraft || canSignSk;

  const hasSafetyGuidanceRows = useMemo(
    () => (workPermit?.classifications ?? []).some((c) => (c.safetyGuidanceRows?.length ?? 0) > 0),
    [workPermit?.classifications],
  );
  const hasWorkClassificationDescription = useMemo(
    () =>
      (workPermit?.classifications ?? []).some((c) => Boolean(c.workClassification?.description?.trim())),
    [workPermit?.classifications],
  );
  const hasGuidelineNarrativePublic = useMemo(
    () =>
      classificationContentEnabled &&
      (workPermit?.classifications ?? []).some((c) => {
        const h = c.safetyGuidelineSnapshot?.trim() || c.workClassification?.safetyGuideline?.trim();
        return Boolean(h);
      }),
    [workPermit?.classifications, classificationContentEnabled],
  );

  const hydrateEditableState = useCallback((wp: WorkPermit) => {
    setProjectName(wp.projectName ?? '');
    setProposedStartDate((wp.proposedStartDate ?? '').slice(0, 10));
    setProposedEndDate((wp.proposedEndDate ?? '').slice(0, 10));
    setWorkStagesDescription(wp.workStagesDescription ?? '');
    setJobSafetyAnalysis(wp.jobSafetyAnalysis ?? '');
    setWorkRequirements(wp.workRequirements ?? '');
    setWorkClassificationOtherDetail(wp.workClassificationOtherDetail ?? '');
    setHazards(
      (wp.hazards ?? []).map((h) => ({
        hazardId: h.hazardId ?? undefined,
        hazardName: h.hazardName ?? '',
        activity: h.activity ?? undefined,
        mitigation: h.mitigation ?? undefined,
      })),
    );
    setAttachments(
      (wp.attachments ?? []).map((a) => ({
        fileUrl: a.fileUrl,
        fileName: a.fileName,
        fileType: a.fileType,
        description: a.description,
      })),
    );
  }, []);

  const load = useCallback(async () => {
    if (!token) {
      setLoadError('Invalid link');
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const res = await workPermitService.getPublicByToken(token);
      setWorkPermit(res.workPermit);
      setApplicantPhase(res.applicantPhase);
      setCanEditDraft(res.canEditDraft);
      setCanSignSk(res.canSignSk);
      setCanSignSkAction(res.canSignSkAction);
      setCourseVerification(res.courseVerification);
      setMitigationsByRiskIdPrefetch(res.mitigationsByRiskId);
      hydrateEditableState(res.workPermit);
    } catch (e) {
      const msg = getErrorMessage(e);
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [token, hydrateEditableState]);

  useEffect(() => {
    void load();
  }, [load]);

  const statusBadge = useMemo(() => {
    const s = workPermit?.status;
    if (!s) return null;
    return <Badge variant="secondary">{s.replace(/_/g, ' ')}</Badge>;
  }, [workPermit?.status]);

  const buildUpdatePayload = (): UpdateWorkPermitDTO => {
    return {
      projectName: projectName.trim(),
      proposedStartDate: proposedStartDate || undefined,
      proposedEndDate: proposedEndDate || undefined,
      workStagesDescription,
      jobSafetyAnalysis: jobSafetyAnalysis?.trim() ? jobSafetyAnalysis : undefined,
      workRequirements: workRequirements?.trim() ? workRequirements : undefined,
      workClassificationOtherDetail: workClassificationOtherDetail?.trim()
        ? workClassificationOtherDetail
        : undefined,
      hazards: hazards
        .map((h, idx) => ({
          hazardId: h.hazardId?.trim() || undefined,
          hazardName: h.hazardName ?? '',
          activity: h.activity?.trim() || undefined,
          mitigation: h.mitigation?.trim() || undefined,
          order: idx,
        }))
        .filter((h) => h.hazardName.trim() || h.activity || h.mitigation || h.hazardId),
      attachments: attachments
        .map((a, idx) => ({
          fileUrl: a.fileUrl,
          fileName: a.fileName,
          fileType: a.fileType,
          description: a.description,
          order: idx,
        }))
        .filter((a) => a.fileUrl.trim() && a.fileName.trim()),
    };
  };

  const handleSave = async () => {
    if (!token || !canEditDraft) return;
    setSaving(true);
    try {
      const updated = await workPermitService.updatePublicByToken(
        token,
        buildUpdatePayload(),
      );
      setWorkPermit(updated);
      hydrateEditableState(updated);
      toast.success('Saved');
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!token || !canEditDraft) return;
    setSubmitting(true);
    try {
      await workPermitService.submitPublicByToken(token);
      toast.success('Submitted');
      await load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignSk = async () => {
    if (!token || !canSignSkAction) return;
    setSigningSk(true);
    try {
      const updated = await workPermitService.signSkPublicByToken(
        token,
        applicantSignature.trim() || undefined,
      );
      setWorkPermit(updated);
      hydrateEditableState(updated);
      setSignSkDialogOpen(false);
      setApplicantSignature('');
      toast.success('Signed — permit sent for security review');
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSigningSk(false);
    }
  };

  if (loading) {
    return (
      <>
        <PublicAppModuleHeader
          moduleIcon={ClipboardList}
          moduleTitle={PUBLIC_WORK_PERMIT_MODULE_TITLE}
          moduleDescription={PUBLIC_WORK_PERMIT_MODULE_DESC}
        />
        <div className="flex justify-center py-24">
          <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        </div>
      </>
    );
  }

  if (loadError || !workPermit) {
    return (
      <>
        <PublicAppModuleHeader
          moduleIcon={ClipboardList}
          moduleTitle={PUBLIC_WORK_PERMIT_MODULE_TITLE}
          moduleDescription={PUBLIC_WORK_PERMIT_MODULE_DESC}
        />
        <div className="container mx-auto max-w-lg py-16 px-4">
          <Card>
            <CardHeader>
              <CardTitle>Link unavailable</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              {loadError ||
                'This link is invalid or has expired. Please contact your supervisor for a new link.'}
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <PublicAppModuleHeader
        moduleIcon={ClipboardList}
        moduleTitle={PUBLIC_WORK_PERMIT_MODULE_TITLE}
        moduleDescription={PUBLIC_WORK_PERMIT_MODULE_DESC}
      />
      <div className="container mx-auto py-8 max-w-4xl px-4 space-y-6">
        <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-lg">Work Permit {displayField(workPermit.code)}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {displayField(workPermit.projectName)}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {statusBadge}
              {applicantPhase ? (
                <Badge variant="outline" className="text-xs">
                  {applicantPhase === 'draft' && 'Phase: fill & submit'}
                  {applicantPhase === 'sign_sk' && 'Phase: sign-off'}
                  {applicantPhase === 'view' && 'Phase: view only'}
                </Badge>
              ) : null}
              {canEditDraft ? (
                <Badge className="bg-primary text-primary-foreground">You can edit & submit</Badge>
              ) : null}
              {canSignSk ? (
                <Badge className="bg-amber-600 text-white hover:bg-amber-600">Action: sign safety guideline</Badge>
              ) : null}
              {!isApplicantActionPhase ? <Badge variant="outline">View only</Badge> : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Area</dt>
              <dd className="font-medium mt-0.5">
                {displayField(workPermit.area?.name)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Company</dt>
              <dd className="font-medium mt-0.5">
                {displayField(workPermit.company?.name)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Proposed start</dt>
              <dd className="font-medium mt-0.5">
                {displayField(workPermit.proposedStartDate?.slice(0, 10))}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Proposed end</dt>
              <dd className="font-medium mt-0.5">
                {displayField(workPermit.proposedEndDate?.slice(0, 10))}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {canEditDraft ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fill work permit (draft)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Project name</Label>
                <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Others (detail)</Label>
                <Input
                  value={workClassificationOtherDetail}
                  onChange={(e) => setWorkClassificationOtherDetail(e.target.value)}
                  placeholder="Only if you selected Others"
                />
              </div>
              <div className="space-y-2">
                <Label>Proposed start date</Label>
                <Input
                  type="date"
                  value={proposedStartDate}
                  onChange={(e) => setProposedStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Proposed end date</Label>
                <Input
                  type="date"
                  value={proposedEndDate}
                  onChange={(e) => setProposedEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Work stages description</Label>
              <Textarea
                className="min-h-[120px]"
                value={workStagesDescription}
                onChange={(e) => setWorkStagesDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Job safety analysis (optional)</Label>
              <Textarea
                className="min-h-[100px]"
                value={jobSafetyAnalysis}
                onChange={(e) => setJobSafetyAnalysis(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Work requirements (optional)</Label>
              <Textarea
                className="min-h-[100px]"
                value={workRequirements}
                onChange={(e) => setWorkRequirements(e.target.value)}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Hazards</p>
                  <p className="text-xs text-muted-foreground">
                    Add hazard rows if applicable.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setHazards((prev) => [
                      ...prev,
                      { hazardName: '', activity: '', mitigation: '' },
                    ])
                  }
                >
                  Add row
                </Button>
              </div>
              <div className="space-y-4">
                {hazards.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hazard rows.</p>
                ) : (
                  hazards.map((h, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-6 space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Hazard name</Label>
                            <Input
                              value={h.hazardName}
                              onChange={(e) =>
                                setHazards((prev) =>
                                  prev.map((x, i) =>
                                    i === idx ? { ...x, hazardName: e.target.value } : x,
                                  ),
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Hazard id (optional)</Label>
                            <Input
                              value={h.hazardId ?? ''}
                              onChange={(e) =>
                                setHazards((prev) =>
                                  prev.map((x, i) =>
                                    i === idx ? { ...x, hazardId: e.target.value } : x,
                                  ),
                                )
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Activity (optional)</Label>
                          <Textarea
                            value={h.activity ?? ''}
                            onChange={(e) =>
                              setHazards((prev) =>
                                prev.map((x, i) =>
                                  i === idx ? { ...x, activity: e.target.value } : x,
                                ),
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Mitigation (optional)</Label>
                          <Textarea
                            value={h.mitigation ?? ''}
                            onChange={(e) =>
                              setHazards((prev) =>
                                prev.map((x, i) =>
                                  i === idx ? { ...x, mitigation: e.target.value } : x,
                                ),
                              )
                            }
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() =>
                              setHazards((prev) => prev.filter((_, i) => i !== idx))
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Attachments</p>
                  <p className="text-xs text-muted-foreground">
                    Add file URL + name (upload happens outside this page).
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setAttachments((prev) => [
                      ...prev,
                      { fileUrl: '', fileName: '', description: '' },
                    ])
                  }
                >
                  Add row
                </Button>
              </div>
              <div className="space-y-4">
                {attachments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No attachments.</p>
                ) : (
                  attachments.map((a, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-6 space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>File name</Label>
                            <Input
                              value={a.fileName}
                              onChange={(e) =>
                                setAttachments((prev) =>
                                  prev.map((x, i) =>
                                    i === idx ? { ...x, fileName: e.target.value } : x,
                                  ),
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>File type (optional)</Label>
                            <Input
                              value={a.fileType ?? ''}
                              onChange={(e) =>
                                setAttachments((prev) =>
                                  prev.map((x, i) =>
                                    i === idx ? { ...x, fileType: e.target.value } : x,
                                  ),
                                )
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>File URL</Label>
                          <Input
                            value={a.fileUrl}
                            onChange={(e) =>
                              setAttachments((prev) =>
                                prev.map((x, i) =>
                                  i === idx ? { ...x, fileUrl: e.target.value } : x,
                                ),
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description (optional)</Label>
                          <Textarea
                            value={a.description ?? ''}
                            onChange={(e) =>
                              setAttachments((prev) =>
                                prev.map((x, i) =>
                                  i === idx ? { ...x, description: e.target.value } : x,
                                ),
                              )
                            }
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() =>
                              setAttachments((prev) => prev.filter((_, i) => i !== idx))
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleSave} disabled={saving || submitting}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button onClick={handleSubmit} disabled={saving || submitting}>
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {canSignSk ? (
        <WorkPermitSection
          id="public-work-permit-section-sk-ack"
          title="Safety Guideline Acknowledgment"
        >
          <Card>
            <CardHeader>
              <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_G_SUB.byClassification}</WorkPermitSubsectionTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {courseVerification?.enabled && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Course verification (HSE / LMS)</p>
                  <p className="text-xs text-muted-foreground">
                    The applicant must complete the required course(s) in the HSE app (signed in) before
                    you can sign. Completion is stored on the user profile.
                  </p>
                  {courseVerification.assignees.length > 0 ? (
                    <ul className="text-sm list-disc pl-4 space-y-1">
                      {courseVerification.assignees.map((a) => (
                        <li key={a.userId}>
                          {a.displayName} ({assigneeSourceLabel(a.source)})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Applicant is not linked to a user for course checks. Contact HSE if this is unexpected.
                    </p>
                  )}
                  {courseVerification.requiredCourses.length > 0 && courseVerification.assignees.length > 0 && (
                    <div className="border rounded-md overflow-x-auto text-sm">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="p-2 font-medium">Course</th>
                            {courseVerification.assignees.map((a) => (
                              <th key={a.userId} className="p-2 font-medium min-w-[7rem]">
                                {a.displayName}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {courseVerification.requiredCourses
                            .filter((rc) => rc.isRequired)
                            .map((rc) => (
                              <tr key={rc.courseId} className="border-b last:border-0">
                                <td className="p-2 align-top">
                                  {rc.courseTitle || rc.courseId}
                                </td>
                                {courseVerification.assignees.map((a) => {
                                  const done = rc.userCompletions[a.userId] === true;
                                  return (
                                    <td key={a.userId} className="p-2 align-top">
                                      <span className={done ? 'text-primary font-medium' : 'text-destructive font-medium'}>
                                        {done ? 'Complete' : 'Not complete'}
                                      </span>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {!canSignSkAction && (courseVerification.unmetMessages.length > 0 || !courseVerification.allRequiredCompleted) ? (
                    <Alert variant="destructive">
                      <p className="text-sm font-semibold">Sign-off blocked</p>
                      <AlertDescription>
                        <ul className="list-disc pl-4 space-y-1">
                          {courseVerification.unmetMessages.length > 0
                            ? courseVerification.unmetMessages.map((m, i) => <li key={i}>{m}</li>)
                            : <li>Complete all required course assignments before signing.</li>}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  ) : null}
                </div>
              )}

              {hasSafetyGuidanceRows || hasGuidelineNarrativePublic || hasWorkClassificationDescription ? (
                <WorkPermitSafetyGuidelineDisplay
                  classifications={workPermit.classifications}
                  showGuidelineNarrative={classificationContentEnabled}
                  mitigationsByRiskId={mitigationsByRiskId}
                  mitigationsLoadingByRiskId={mitigationsLoadingByRiskId}
                  mitigationsErrorByRiskId={mitigationsErrorByRiskId}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  When Section G is present below, read the full safety content there, then use Open sign-off to
                  complete your acknowledgment.
                </p>
              )}
              <Button
                type="button"
                onClick={() => setSignSkDialogOpen(true)}
                className="w-full sm:w-auto"
                disabled={!canSignSkAction}
              >
                <PenLine className="mr-2 h-4 w-4" />
                Open sign-off
              </Button>
            </CardContent>
          </Card>
        </WorkPermitSection>
      ) : null}

      <PublicWorkPermitReadOnlyDetail
        workPermit={workPermit}
        hideSectionG={canSignSk}
        mitigationsByRiskIdPrefetched={mitigationsByRiskIdPrefetch}
        courseVerificationNote={
          workPermit.requireCourseVerification
            ? 'When course verification is required, the applicant completes the listed courses in the HSE app (signed in). Completion is recorded on the user profile. This public page does not run course quizzes here.'
            : undefined
        }
      />

      <Dialog open={signSkDialogOpen} onOpenChange={setSignSkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Safety Guideline (SK)</DialogTitle>
            <DialogDescription>
              Confirm that you have reviewed and accepted the safety guideline from HSE.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Safety Guideline</Label>
              {hasSafetyGuidanceRows || hasGuidelineNarrativePublic || hasWorkClassificationDescription ? (
                <div className="rounded-md border p-3 text-sm bg-muted/30 max-h-[320px] overflow-y-auto mt-2">
                  <WorkPermitSafetyGuidelineDisplay
                    classifications={workPermit.classifications}
                    showGuidelineNarrative={classificationContentEnabled}
                    mitigationsByRiskId={mitigationsByRiskId}
                    mitigationsLoadingByRiskId={mitigationsLoadingByRiskId}
                    mitigationsErrorByRiskId={mitigationsErrorByRiskId}
                  />
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Guideline text may appear in Section G on this page. You can still confirm and submit your
                  sign-off below.
                </p>
              )}
            </div>
            <div>
              <Label>Signature / Acknowledgment (optional)</Label>
              <Input
                value={applicantSignature}
                onChange={(e) => setApplicantSignature(e.target.value)}
                placeholder="Type your name or signature token"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignSkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSignSk} disabled={signingSk || !canSignSkAction}>
              {signingSk ? 'Signing...' : 'Sign & continue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
};

export default PublicWorkPermitPage;

