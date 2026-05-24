import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { ClipboardList, FileSignature, Info, PenLine } from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Checkbox } from '@/core/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Separator } from '@/core/components/ui/separator';
import { Textarea } from '@/core/components/ui/textarea';
import workPermitService from '../services/workPermitService';
import type { UpdateWorkPermitDTO, WorkPermit } from '../types/work-permit.types';
import { PublicWorkPermitReadOnlyDetail } from '../components/PublicWorkPermitReadOnlyDetail';
import { WorkPermitSafetyGuidelineDisplay } from '../components/WorkPermitSafetyGuidelineDisplay';
import { WorkPermitSection, WorkPermitSubsectionTitle } from '../components/WorkPermitSection';
import { WORK_PERMIT_SECTION_G_SUB } from '../constants/workPermitSections';
import { useWorkPermitClassificationRiskMitigations } from '../hooks/useWorkPermitClassificationRiskMitigations';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import { PublicAppModuleHeader } from '@/core/components/layout/PublicAppModuleHeader';
import PublicWorkPermitInlineCoursePanel from '../components/PublicWorkPermitInlineCoursePanel';
import type { RiskMitigation } from '@/modules/risk-assessment/services/riskMitigationService';
import type { PublicWorkPermitCourseVerification, WorkPermitPublicApplicantPhase } from '../types/work-permit.types';
import { isWorkPermitWorkerHealthSatisfiedForSubmit } from '../utils/healthScreeningEligibility';

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
  const [classificationContentEnabled, setClassificationContentEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ackSafetyGuideline, setAckSafetyGuideline] = useState(false);
  const [ackTraining, setAckTraining] = useState(false);
  const [ackDataAccurate, setAckDataAccurate] = useState(false);
  const [signingSk, setSigningSk] = useState(false);

  const {
    mitigationsByRiskId,
    mitigationsLoadingByRiskId,
    mitigationsErrorByRiskId,
  } = useWorkPermitClassificationRiskMitigations(
    workPermit?.classifications,
    mitigationsByRiskIdPrefetch,
  );

  const workersHealthReadyForPublicSubmit = useMemo(() => {
    const workers = workPermit?.workers;
    if (!workers?.length) return false;
    return workers.every((w) => isWorkPermitWorkerHealthSatisfiedForSubmit(w));
  }, [workPermit?.workers]);

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

  const requiredCourseRows = useMemo(
    () => (courseVerification?.requiredCourses ?? []).filter((r) => r.isRequired),
    [courseVerification?.requiredCourses],
  );
  const trainingApplies = useMemo(
    () => Boolean(courseVerification?.enabled && requiredCourseRows.length > 0),
    [courseVerification?.enabled, requiredCourseRows.length],
  );
  const signOffAckComplete = useMemo(
    () =>
      ackSafetyGuideline &&
      ackDataAccurate &&
      (trainingApplies ? ackTraining : true),
    [ackSafetyGuideline, ackDataAccurate, ackTraining, trainingApplies],
  );
  const inlineApplicantUserId = courseVerification?.assignees[0]?.userId;
  const [inlineCourseId, setInlineCourseId] = useState<string>('');

  useEffect(() => {
    if (requiredCourseRows.length === 0 || !inlineApplicantUserId) return;
    const firstIncomplete = requiredCourseRows.find(
      (r) => !r.userCompletions[inlineApplicantUserId],
    )?.courseId;
    const fallback = firstIncomplete ?? requiredCourseRows[0]?.courseId;
    if (fallback) {
      setInlineCourseId((prev) => {
        if (prev && requiredCourseRows.some((r) => r.courseId === prev)) return prev;
        return fallback;
      });
    }
  }, [requiredCourseRows, inlineApplicantUserId]);

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

  const load = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!token) {
      setLoadError('Invalid link');
      if (!silent) setLoading(false);
      return;
    }
    if (!silent) {
      setLoading(true);
      setLoadError(null);
    }
    try {
      const res = await workPermitService.getPublicByToken(token);
      setWorkPermit(res.workPermit);
      setApplicantPhase(res.applicantPhase);
      setCanEditDraft(res.canEditDraft);
      setCanSignSk(res.canSignSk);
      setCanSignSkAction(res.canSignSkAction);
      setCourseVerification(res.courseVerification);
      setMitigationsByRiskIdPrefetch(res.mitigationsByRiskId);
      setClassificationContentEnabled(res.classificationContentEnabled);
      hydrateEditableState(res.workPermit);
    } catch (e) {
      const msg = getErrorMessage(e);
      if (silent) {
        toast.error(msg);
      } else {
        setLoadError(msg);
        toast.error(msg);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
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
    if (!workersHealthReadyForPublicSubmit) {
      toast.error(
        'Each listed worker must have a valid health declaration: a completed online declaration in the validity period, or a declaration file on the worker profile. See the Workers section below.',
      );
      return;
    }
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

  const resetSignOffAckState = useCallback(() => {
    setAckSafetyGuideline(false);
    setAckTraining(false);
    setAckDataAccurate(false);
  }, []);

  const buildPublicSkSignature = useCallback((): string => {
    return JSON.stringify({
      v: 1,
      t: 'public-sk',
      at: new Date().toISOString(),
      safetyGuideline: true,
      training: trainingApplies ? 'acknowledged' : 'na',
      dataAccurate: true,
    });
  }, [trainingApplies]);

  const handleSignSk = async () => {
    if (!token || !canSignSkAction || !signOffAckComplete) return;
    setSigningSk(true);
    try {
      await workPermitService.signSkPublicByToken(token, buildPublicSkSignature());
      resetSignOffAckState();
      toast.success('Signed — permit sent for security review');
      await load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSigningSk(false);
    }
  };

  const scrollToSkAcknowledgment = useCallback(() => {
    document.getElementById('public-work-permit-section-sk-ack')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, []);

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
        <Alert className="border-primary/20 bg-muted/30">
          <Info className="h-4 w-4" aria-hidden />
          <AlertDescription>
            <p className="font-medium text-foreground">Before you continue</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              <li>
                Read this work permit in full, from the top of the page through the sections below, before you
                sign or submit anything.
              </li>
              <li>
                Confirm that the information shown is complete and accurate for the work to be performed.
              </li>
              <li>
                Where required training applies, complete that training and ensure you are qualified before
                you acknowledge the safety guideline and terms.
              </li>
              <li>
                Use the acknowledgment step only when you have reviewed the safety guideline, accepted the
                applicable terms, and agree that the data you confirm is true and complete.
              </li>
            </ul>
          </AlertDescription>
        </Alert>

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

            {!workersHealthReadyForPublicSubmit ? (
              <Alert variant="destructive">
                <AlertDescription>
                  Submit is disabled until every worker has a valid health declaration (online declaration
                  in the validity window and/or a declaration file on the worker profile). Check the
                  Workers section, use &quot;Get declaration link&quot; to share the questionnaire if needed, then
                  refresh this page.
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleSave} disabled={saving || submitting}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={saving || submitting || !workersHealthReadyForPublicSubmit}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <PublicWorkPermitReadOnlyDetail
        workPermit={workPermit}
        hideSectionG={canSignSk}
        classificationContentEnabled={classificationContentEnabled}
        mitigationsByRiskId={mitigationsByRiskId}
        mitigationsLoadingByRiskId={mitigationsLoadingByRiskId}
        mitigationsErrorByRiskId={mitigationsErrorByRiskId}
        publicApplicantToken={token}
        refreshing={refreshing}
        onRefresh={async () => {
          setRefreshing(true);
          try {
            await load({ silent: true });
          } finally {
            setRefreshing(false);
          }
        }}
      />

      {canSignSk &&
      courseVerification?.enabled &&
      applicantPhase === 'sign_sk' &&
      inlineCourseId &&
      inlineApplicantUserId ? (
        <WorkPermitSection
          id="public-work-permit-section-required-training"
          title="Required training"
          titleClassName="scroll-mt-20"
        >
          <Card className="border-primary/25 bg-muted/30">
            <CardContent className="pt-6 space-y-3">
              <p className="text-xs text-muted-foreground">
                Complete the required course content below. Progress is saved while this link is valid; you
                can close the page and resume. When all required courses show complete, use Refresh permit
                status, then review the safety guideline and complete the acknowledgment below.
              </p>
              {requiredCourseRows.length > 1 ? (
                <div className="space-y-1.5 max-w-md">
                  <Label className="text-xs">Course</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                    value={inlineCourseId}
                    onChange={(e) => setInlineCourseId(e.target.value)}
                  >
                    {requiredCourseRows.map((r) => (
                      <option key={r.courseId} value={r.courseId}>
                        {r.courseTitle || r.courseId}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <PublicWorkPermitInlineCoursePanel
                key={inlineCourseId}
                permitToken={token}
                courseId={inlineCourseId}
                courseTitle={requiredCourseRows.find((r) => r.courseId === inlineCourseId)?.courseTitle}
                onContextRefresh={() => {
                  void load({ silent: true });
                }}
              />
            </CardContent>
          </Card>
        </WorkPermitSection>
      ) : null}

      {canSignSk ? (
        <WorkPermitSection
          id="public-work-permit-section-sk-ack"
          title="Safety Guideline Acknowledgment"
          titleClassName="scroll-mt-20"
        >
          <Card>
            <CardHeader>
              <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_G_SUB.byClassification}</WorkPermitSubsectionTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  When the full safety guideline appears in this section, read it here, then complete the
                  checkboxes and submit your acknowledgment below.
                </p>
              )}

              <div className="space-y-3 rounded-md border p-3 bg-muted/20">
                <p className="text-sm font-medium">Confirm the following to submit</p>
                <p className="text-xs text-muted-foreground">
                  Review the safety guideline in this section above, then mark each item to continue.
                </p>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="public-sk-ack-safety"
                    checked={ackSafetyGuideline}
                    onCheckedChange={(c) => setAckSafetyGuideline(c === true)}
                  />
                  <label
                    htmlFor="public-sk-ack-safety"
                    className="text-sm leading-snug text-foreground cursor-pointer"
                  >
                    I acknowledge the safety guideline and understand my obligations for safe work.
                  </label>
                </div>
                {trainingApplies ? (
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="public-sk-ack-training"
                      checked={ackTraining}
                      onCheckedChange={(c) => setAckTraining(c === true)}
                    />
                    <label
                      htmlFor="public-sk-ack-training"
                      className="text-sm leading-snug text-foreground cursor-pointer"
                    >
                      I confirm I have read and completed the required training for this work permit, where
                      applicable.
                    </label>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground pl-0.5">
                    Required training: not applicable for this permit.
                  </p>
                )}
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="public-sk-ack-data"
                    checked={ackDataAccurate}
                    onCheckedChange={(c) => setAckDataAccurate(c === true)}
                  />
                  <label
                    htmlFor="public-sk-ack-data"
                    className="text-sm leading-snug text-foreground cursor-pointer"
                  >
                    I have verified the information on this permit; it is complete and correct to the best of my
                    knowledge.
                  </label>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={handleSignSk}
                  className="w-full sm:w-auto"
                  disabled={signingSk || !canSignSkAction || !signOffAckComplete}
                >
                  <PenLine className="mr-2 h-4 w-4" />
                  {signingSk ? 'Signing...' : 'Sign & continue'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </WorkPermitSection>
      ) : null}

      {canSignSk ? (
        <Button
          type="button"
          variant="default"
          size="icon"
          className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-lg"
          onClick={scrollToSkAcknowledgment}
          aria-label="Go to safety guideline sign-off"
          title="Go to safety guideline sign-off"
        >
          <FileSignature className="h-5 w-5" aria-hidden />
        </Button>
      ) : null}

      </div>
    </>
  );
};

export default PublicWorkPermitPage;

