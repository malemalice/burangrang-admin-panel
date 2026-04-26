import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Separator } from '@/core/components/ui/separator';
import { Textarea } from '@/core/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { format } from 'date-fns';
import workPermitService from '../services/workPermitService';
import type { UpdateWorkPermitDTO, WorkPermit } from '../types/work-permit.types';
import { WorkPermitSafetyGuidelineDisplay } from '../components/WorkPermitSafetyGuidelineDisplay';
import { WorkPermitSection, WorkPermitSubsectionTitle } from '../components/WorkPermitSection';
import {
  WORK_PERMIT_SECTIONS,
  WORK_PERMIT_SECTION_A_SUB,
  WORK_PERMIT_SECTION_B_SUB,
  WORK_PERMIT_SECTION_C_SUB,
  WORK_PERMIT_SECTION_D_SUB,
  WORK_PERMIT_SECTION_E_SUB,
  WORK_PERMIT_SECTION_F_SUB,
  WORK_PERMIT_SECTION_G_SUB,
} from '../constants/workPermitSections';

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
  const [isEditable, setIsEditable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const canEdit = isEditable;

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
      setIsEditable(res.isEditable === true);
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

  const showSectionG = useMemo(() => {
    const cls = workPermit?.classifications ?? [];
    const hasRows = cls.some((c) => (c.safetyGuidanceRows?.length ?? 0) > 0);
    const hasNarrative = cls.some((c) => {
      const h =
        c.safetyGuidelineSnapshot?.trim() ||
        c.workClassification?.safetyGuideline?.trim() ||
        '';
      return Boolean(h);
    });
    const hasDesc = cls.some((c) => Boolean(c.workClassification?.description?.trim()));
    return hasRows || hasNarrative || hasDesc;
  }, [workPermit?.classifications]);

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
    if (!token || !canEdit) return;
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
    if (!token || !canEdit) return;
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

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (loadError || !workPermit) {
    return (
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
    );
  }

  return (
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
            <div className="flex items-center gap-2">
              {statusBadge}
              {canEdit ? (
                <Badge className="bg-primary text-primary-foreground">Editable</Badge>
              ) : (
                <Badge variant="outline">Read-only</Badge>
              )}
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

      {canEdit ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fill work permit</CardTitle>
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
      ) : (
        <div className="space-y-6">
          <WorkPermitSection id="public-work-permit-section-a" title={WORK_PERMIT_SECTIONS.A}>
            <Card>
              <CardHeader>
                <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_A_SUB.classifications}</WorkPermitSubsectionTitle>
              </CardHeader>
              <CardContent>
                {(workPermit.classifications?.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">No classifications selected.</p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {workPermit.classifications!.map((c) => (
                        <Badge key={c.id} variant="secondary">
                          {c.workClassification
                            ? `${c.workClassification.name ?? ''}${c.workClassification.code ? ` (${c.workClassification.code})` : ''}`.trim() ||
                              '—'
                            : '—'}
                        </Badge>
                      ))}
                    </div>
                    {workPermit.workClassificationOtherDetail?.trim() ? (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Others (detail)</p>
                        <p className="text-sm whitespace-pre-wrap">{workPermit.workClassificationOtherDetail}</p>
                      </div>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          </WorkPermitSection>

          <WorkPermitSection id="public-work-permit-section-b" title={WORK_PERMIT_SECTIONS.B}>
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_B_SUB.projectSchedule}</WorkPermitSubsectionTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <div className="mt-1">{statusBadge}</div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Created by</Label>
                      <p className="mt-1">
                        {displayField(
                          workPermit.creator
                            ? `${workPermit.creator.firstName ?? ''} ${workPermit.creator.lastName ?? ''}`.trim() ||
                                workPermit.creator.email
                            : workPermit.createdBy,
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Applicant (Contractor)</Label>
                      <p className="mt-1">
                        {displayField(
                          workPermit.applicant
                            ? `${workPermit.applicant.firstName ?? ''} ${workPermit.applicant.lastName ?? ''}`.trim() ||
                                workPermit.applicant.email
                            : workPermit.applicantUserId,
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Project name</Label>
                      <p className="mt-1">{displayField(workPermit.projectName)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Area</Label>
                      <p className="mt-1">{displayField(workPermit.area?.name)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Company</Label>
                      <p className="mt-1">
                        {displayField(workPermit.company?.name)}
                        {workPermit.company?.phone ? ` · ${workPermit.company.phone}` : ''}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Proposed start date</Label>
                      <p className="mt-1">
                        {workPermit.proposedStartDate
                          ? format(new Date(workPermit.proposedStartDate), 'MMM dd, yyyy')
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Proposed end date</Label>
                      <p className="mt-1">
                        {workPermit.proposedEndDate
                          ? format(new Date(workPermit.proposedEndDate), 'MMM dd, yyyy')
                          : '—'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_B_SUB.workDescription}</WorkPermitSubsectionTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Work stages description</Label>
                    <p className="mt-1 whitespace-pre-wrap">
                      {displayField(workPermit.workStagesDescription)}
                    </p>
                  </div>
                  {workPermit.jobSafetyAnalysis?.trim() ? (
                    <div>
                      <Label className="text-muted-foreground">Job safety analysis</Label>
                      <p className="mt-1 whitespace-pre-wrap">{workPermit.jobSafetyAnalysis}</p>
                    </div>
                  ) : null}
                  {workPermit.workRequirements?.trim() ? (
                    <div>
                      <Label className="text-muted-foreground">Work requirements</Label>
                      <p className="mt-1 whitespace-pre-wrap">{workPermit.workRequirements}</p>
                    </div>
                  ) : null}
                  <div>
                    <Label className="text-muted-foreground">Applicant sign-off (HSE safety guideline)</Label>
                    <p className="mt-1">
                      {workPermit.applicantSignedAt
                        ? format(new Date(workPermit.applicantSignedAt), 'MMM dd, yyyy HH:mm')
                        : 'Not signed yet'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_B_SUB.workers}</WorkPermitSubsectionTitle>
                </CardHeader>
                <CardContent>
                  {(workPermit.workers?.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground">No workers listed.</p>
                  ) : (
                    <div className="space-y-2">
                      {workPermit.workers!.map((w) => (
                        <div key={w.id} className="flex items-center justify-between p-2 border rounded-md text-sm">
                          <div>
                            <p className="font-medium">
                              {w.user
                                ? `${w.user.firstName ?? ''} ${w.user.lastName ?? ''}`.trim() ||
                                  w.user.email ||
                                  'Unknown'
                                : 'Unknown'}
                            </p>
                            {w.profession ? (
                              <p className="text-muted-foreground">
                                {w.profession.name} ({w.profession.code})
                              </p>
                            ) : null}
                            {w.idNumber ? (
                              <p className="text-muted-foreground">ID: {w.idNumber}</p>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_B_SUB.employees}</WorkPermitSubsectionTitle>
                </CardHeader>
                <CardContent>
                  {(workPermit.employees?.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground">No employees listed.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {workPermit.employees!.map((e) => (
                        <li key={e.id} className="border rounded-md p-2">
                          {e.user
                            ? `${e.user.firstName ?? ''} ${e.user.lastName ?? ''}`.trim() ||
                              e.user.email ||
                              '—'
                            : displayField(e.employeeName)}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_B_SUB.supervisors}</WorkPermitSubsectionTitle>
                </CardHeader>
                <CardContent>
                  {(workPermit.supervisors?.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground">No supervisors listed.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {workPermit.supervisors!.map((s) => (
                        <li key={s.id} className="border rounded-md p-2">
                          {s.guest?.phone
                            ? `${displayField(s.guest?.name)} · ${s.guest.phone}`
                            : displayField(s.guest?.name)}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_B_SUB.hseOfficers}</WorkPermitSubsectionTitle>
                </CardHeader>
                <CardContent>
                  {(workPermit.hseOfficers?.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground">No HSE officers listed.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {workPermit.hseOfficers!.map((h) => (
                        <li key={h.id} className="border rounded-md p-2">
                          {h.user
                            ? `${h.user.firstName ?? ''} ${h.user.lastName ?? ''}`.trim() ||
                              h.user.email ||
                              '—'
                            : '—'}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </WorkPermitSection>

          <WorkPermitSection id="public-work-permit-section-c" title={WORK_PERMIT_SECTIONS.C}>
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_C_SUB.tools}</WorkPermitSubsectionTitle>
                </CardHeader>
                <CardContent>
                  {(workPermit.tools?.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground">No items.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead className="w-24 text-right">Qty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {workPermit.tools!.map((t) => (
                          <TableRow key={t.id}>
                            <TableCell>{displayField(t.tool?.name)}</TableCell>
                            <TableCell>{displayField(t.tool?.code)}</TableCell>
                            <TableCell className="text-right">{t.quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_C_SUB.machines}</WorkPermitSubsectionTitle>
                </CardHeader>
                <CardContent>
                  {(workPermit.machines?.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground">No items.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead className="w-24 text-right">Qty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {workPermit.machines!.map((m) => (
                          <TableRow key={m.id}>
                            <TableCell>{displayField(m.machine?.name)}</TableCell>
                            <TableCell>{displayField(m.machine?.code)}</TableCell>
                            <TableCell className="text-right">{m.quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_C_SUB.materials}</WorkPermitSubsectionTitle>
                </CardHeader>
                <CardContent>
                  {(workPermit.materials?.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground">No items.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead className="w-24 text-right">Qty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {workPermit.materials!.map((m) => (
                          <TableRow key={m.id}>
                            <TableCell>{displayField(m.material?.name)}</TableCell>
                            <TableCell>{displayField(m.material?.code)}</TableCell>
                            <TableCell className="text-right">{m.quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_C_SUB.heavyEquipment}</WorkPermitSubsectionTitle>
                </CardHeader>
                <CardContent>
                  {(workPermit.heavyEquipment?.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground">No items.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead className="w-24 text-right">Qty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {workPermit.heavyEquipment!.map((e) => (
                          <TableRow key={e.id}>
                            <TableCell>{displayField(e.heavyEquipment?.name)}</TableCell>
                            <TableCell>{displayField(e.heavyEquipment?.code)}</TableCell>
                            <TableCell className="text-right">{e.quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </WorkPermitSection>

          <WorkPermitSection id="public-work-permit-section-d" title={WORK_PERMIT_SECTIONS.D}>
            <Card>
              <CardHeader>
                <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_D_SUB.hazards}</WorkPermitSubsectionTitle>
              </CardHeader>
              <CardContent>
                {(workPermit.hazards?.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">No hazard rows.</p>
                ) : (
                  <Table className="table-fixed w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">No</TableHead>
                        <TableHead className="w-[22%] min-w-0">Hazard name</TableHead>
                        <TableHead className="min-w-0">Activity</TableHead>
                        <TableHead className="min-w-0">Mitigation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workPermit.hazards!.map((h, i) => (
                        <TableRow key={h.id}>
                          <TableCell className="align-top text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="align-top min-w-0 whitespace-pre-wrap break-words">
                            {displayField(h.hazardName)}
                          </TableCell>
                          <TableCell className="align-top min-w-0 whitespace-pre-wrap break-words">
                            {displayField(h.activity)}
                          </TableCell>
                          <TableCell className="align-top min-w-0 whitespace-pre-wrap break-words">
                            {displayField(h.mitigation)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </WorkPermitSection>

          <WorkPermitSection id="public-work-permit-section-e" title={WORK_PERMIT_SECTIONS.E}>
            <Card>
              <CardHeader>
                <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_E_SUB.selectedEquipment}</WorkPermitSubsectionTitle>
              </CardHeader>
              <CardContent>
                {(workPermit.safetyEquipment?.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">No safety equipment selected.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {workPermit.safetyEquipment!.map((s) => (
                      <Badge key={s.id} variant="secondary">
                        {s.safetyEquipment
                          ? `${s.safetyEquipment.name ?? ''}${s.safetyEquipment.code ? ` (${s.safetyEquipment.code})` : ''}`.trim() ||
                            '—'
                          : '—'}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </WorkPermitSection>

          {showSectionG ? (
            <WorkPermitSection id="public-work-permit-section-g" title={WORK_PERMIT_SECTIONS.G}>
              <Card>
                <CardHeader>
                  <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_G_SUB.byClassification}</WorkPermitSubsectionTitle>
                </CardHeader>
                <CardContent>
                  <WorkPermitSafetyGuidelineDisplay classifications={workPermit.classifications} />
                </CardContent>
              </Card>
            </WorkPermitSection>
          ) : null}

          <WorkPermitSection id="public-work-permit-section-f" title={WORK_PERMIT_SECTIONS.F}>
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_F_SUB.courseVerification}</WorkPermitSubsectionTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    Require course verification:{' '}
                    <span className="font-medium">{workPermit.requireCourseVerification ? 'Yes' : 'No'}</span>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_F_SUB.requiredCourses}</WorkPermitSubsectionTitle>
                </CardHeader>
                <CardContent>
                  {(workPermit.requiredCourses?.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground">No required courses.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Course</TableHead>
                          <TableHead className="w-28">Required</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {workPermit.requiredCourses!.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell>{displayField(c.course?.title)}</TableCell>
                            <TableCell>{c.isRequired ? 'Yes' : 'No'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_F_SUB.attachments}</WorkPermitSubsectionTitle>
                </CardHeader>
                <CardContent>
                  {(workPermit.attachments?.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground">No attachments.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>File</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {workPermit.attachments!.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell>
                              <a
                                href={a.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary underline underline-offset-2"
                              >
                                {displayField(a.fileName)}
                              </a>
                            </TableCell>
                            <TableCell className="whitespace-pre-wrap">
                              {displayField(a.description)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </WorkPermitSection>
        </div>
      )}
    </div>
  );
};

export default PublicWorkPermitPage;

