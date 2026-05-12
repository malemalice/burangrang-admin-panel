import { useMemo, useState } from 'react';
import type { RiskMitigation } from '@/modules/risk-assessment/services/riskMitigationService';
import { format } from 'date-fns';
import axios from 'axios';
import { toast } from 'sonner';
import { Copy, ExternalLink, Loader2 } from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader } from '@/core/components/ui/card';
import { Label } from '@/core/components/ui/label';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { WorkPermitSafetyGuidelineDisplay } from './WorkPermitSafetyGuidelineDisplay';
import { WorkPermitSection, WorkPermitSubsectionTitle } from './WorkPermitSection';
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
import type { WorkPermit, WorkPermitWorker } from '../types/work-permit.types';
import { hasHealthDeclarationFile } from '../utils/healthScreeningEligibility';
import workPermitService from '../services/workPermitService';

const displayField = (v: string | number | boolean | null | undefined) => {
  if (v == null) return '—';
  const s = String(v).trim();
  return s !== '' ? s : '—';
};

function getPublicDetailErrorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as { message?: string | string[] } | undefined;
    const m = data?.message;
    if (Array.isArray(m)) return m.join(', ');
    if (typeof m === 'string' && m.trim()) return m;
    return e.message || 'Request failed';
  }
  if (e instanceof Error) return e.message;
  return 'Something went wrong';
}

const screeningBadgeClass = {
  valid: 'border-0 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  linkedHere: 'border-0 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  warn: 'border-0 bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
  muted: 'border-0 bg-muted text-muted-foreground',
} as const;

function PublicWorkPermitWorkersList({
  workers,
  workPermitId,
  publicApplicantToken,
}: {
  workers: WorkPermitWorker[];
  workPermitId: string;
  publicApplicantToken?: string;
}) {
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [linkByUserId, setLinkByUserId] = useState<
    Record<string, { linkUrl: string; expiresAt: string }>
  >({});

  const getScreeningBadge = (w: WorkPermitWorker) => {
    const hs = w.healthScreening;
    if (!hs) {
      return { label: 'No online declaration', className: screeningBadgeClass.muted };
    }
    if (hs.status === 'DONE') {
      if (hs.consumedByWorkPermitId === workPermitId) {
        return { label: 'Linked to this permit', className: screeningBadgeClass.linkedHere };
      }
      if (hs.consumedByWorkPermitId == null) {
        return { label: 'Available', className: screeningBadgeClass.valid };
      }
      return { label: 'Used elsewhere', className: screeningBadgeClass.muted };
    }
    return {
      label: hs.status === 'IN_PROGRESS' ? 'In progress' : hs.status.replace(/_/g, ' '),
      className: screeningBadgeClass.warn,
    };
  };

  const fetchLink = async (userId: string) => {
    if (!publicApplicantToken) return;
    setLoadingUserId(userId);
    try {
      const res = await workPermitService.postPublicWorkerHealthScreeningLink(
        publicApplicantToken,
        { userId },
      );
      setLinkByUserId((prev) => ({
        ...prev,
        [userId]: { linkUrl: res.linkUrl, expiresAt: res.expiresAt },
      }));
      toast.success('Declaration link ready — copy or open in a new tab');
    } catch (e) {
      toast.error(getPublicDetailErrorMessage(e));
    } finally {
      setLoadingUserId(null);
    }
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Could not copy — copy the link manually');
    }
  };

  return (
    <div className="space-y-2">
      {workers.map((worker) => {
        const userId = worker.userId;
        const hs = worker.healthScreening;
        const linkedHere =
          hs?.status === 'DONE' && hs.consumedByWorkPermitId === workPermitId;
        const hasFile = hasHealthDeclarationFile(worker.healthDeclarationUrl);
        /** Show health form link whenever the worker has no declaration consumed by THIS permit (file alone does not block — users can still open/share the public questionnaire). */
        const showLinkActions = Boolean(publicApplicantToken) && !linkedHere;
        const cached = userId ? linkByUserId[userId] : undefined;
        const screeningBadge = getScreeningBadge(worker);

        return (
          <div
            key={worker.id}
            className="space-y-2 rounded-md border p-3 sm:p-4"
          >
            <div>
              <p className="font-medium">
                {worker.user
                  ? `${worker.user.firstName ?? ''} ${worker.user.lastName ?? ''}`.trim() ||
                    worker.user.email ||
                    'Unknown'
                  : 'Unknown'}
              </p>
              {worker.profession ? (
                <p className="text-sm text-muted-foreground">
                  {worker.profession.name} ({worker.profession.code})
                </p>
              ) : null}
              {worker.idNumber ? (
                <p className="text-sm text-muted-foreground">ID: {worker.idNumber}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Health declaration</span>
              <Badge variant="secondary" className={screeningBadge.className}>
                {screeningBadge.label}
              </Badge>
              {hs?.status === 'DONE' && !linkedHere ? (
                <span className="text-xs text-muted-foreground">
                  Each permit needs a fresh declaration — start a new one for this worker.
                </span>
              ) : null}
            </div>
            {hasFile ? (
              <p className="text-xs text-muted-foreground">Declaration file on record</p>
            ) : null}
            {publicApplicantToken && showLinkActions ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={loadingUserId === userId}
                  onClick={() => void fetchLink(userId)}
                >
                  {loadingUserId === userId ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating link…
                    </>
                  ) : (
                    'Get declaration link'
                  )}
                </Button>
                {cached ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => void copyLink(cached.linkUrl)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy link
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        window.open(cached.linkUrl, '_blank', 'noopener,noreferrer')
                      }
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open in new tab
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Link expires: {format(new Date(cached.expiresAt), 'MMM d, yyyy HH:mm')}
                    </span>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

type Props = {
  workPermit: WorkPermit;
  hideSectionG?: boolean;
  /** From public GET bundle (server settings) — avoids /settings/value on anonymous pages */
  classificationContentEnabled: boolean;
  mitigationsByRiskId: Record<string, RiskMitigation[]>;
  mitigationsLoadingByRiskId: Record<string, boolean>;
  mitigationsErrorByRiskId: Record<string, string | undefined>;
  /** When set, show worker health declaration status and token-based fill links */
  publicApplicantToken?: string;
};

/**
 * Read-only full permit content for the anonymous public link (no approval/PDF).
 * Mirrors [WorkPermitDetailPage] sections A–F (+ G) for consistency.
 */
export function PublicWorkPermitReadOnlyDetail({
  workPermit,
  hideSectionG = false,
  classificationContentEnabled,
  mitigationsByRiskId,
  mitigationsLoadingByRiskId,
  mitigationsErrorByRiskId,
  publicApplicantToken,
}: Props) {

  const createdByLabel = (() => {
    const creator = workPermit?.creator;
    if (!creator) return displayField(workPermit?.createdBy);
    const fullName = `${creator.firstName ?? ''} ${creator.lastName ?? ''}`.trim();
    return displayField(fullName || creator.email || workPermit?.createdBy);
  })();
  const applicantLabel = (() => {
    const applicant = workPermit?.applicant;
    if (!applicant) return displayField(workPermit?.applicantUserId);
    const fullName = `${applicant.firstName ?? ''} ${applicant.lastName ?? ''}`.trim();
    return displayField(fullName || applicant.email || workPermit?.applicantUserId);
  })();

  const classifications = workPermit?.classifications;
  const hasSafetyGuidanceRows = useMemo(
    () => (classifications ?? []).some((c) => (c.safetyGuidanceRows?.length ?? 0) > 0),
    [classifications],
  );
  const hasGuidelineNarrativeHtml = useMemo(
    () =>
      classificationContentEnabled &&
      (classifications ?? []).some((c) => {
        const h = c.safetyGuidelineSnapshot?.trim() || c.workClassification?.safetyGuideline?.trim();
        return Boolean(h);
      }),
    [classifications, classificationContentEnabled],
  );
  const hasWorkClassificationDescription = useMemo(
    () => (classifications ?? []).some((c) => Boolean(c.workClassification?.description?.trim())),
    [classifications],
  );
  const showSectionG =
    hasSafetyGuidanceRows || hasGuidelineNarrativeHtml || hasWorkClassificationDescription;

  return (
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge>{workPermit.status.replace(/_/g, ' ')}</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created by</Label>
                  <p className="mt-1">{createdByLabel}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Applicant (Contractor)</Label>
                  <p className="mt-1">{applicantLabel}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Project Name</Label>
                  <p className="mt-1">{workPermit.projectName}</p>
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
                  <p className="mt-1">{format(new Date(workPermit.proposedStartDate), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Proposed end date</Label>
                  <p className="mt-1">{format(new Date(workPermit.proposedEndDate), 'MMM dd, yyyy')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_B_SUB.workDescription}</WorkPermitSubsectionTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Work Stages Description</Label>
                <p className="mt-1 whitespace-pre-wrap">{displayField(workPermit.workStagesDescription)}</p>
              </div>
              {workPermit.jobSafetyAnalysis?.trim() ? (
                <div>
                  <Label className="text-muted-foreground">Job Safety Analysis</Label>
                  <p className="mt-1 whitespace-pre-wrap">{workPermit.jobSafetyAnalysis}</p>
                </div>
              ) : null}
              {workPermit.workRequirements?.trim() ? (
                <div>
                  <Label className="text-muted-foreground">Work Requirements</Label>
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
              {publicApplicantToken ? (
                <Alert className="mb-4">
                  <AlertDescription className="text-sm leading-relaxed">
                    Each worker on this permit must have a valid health declaration: either a completed online
                    declaration (below) or a declaration file already stored on the worker profile. Links are
                    time-limited—share one with the worker to complete the questionnaire, or open it for them. After
                    they finish, refresh this page to see updated status.
                  </AlertDescription>
                </Alert>
              ) : null}
              {(workPermit.workers?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">No workers listed.</p>
              ) : (
                <PublicWorkPermitWorkersList
                  workers={workPermit.workers!}
                  workPermitId={workPermit.id}
                  publicApplicantToken={publicApplicantToken}
                />
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
                <ul className="space-y-2">
                  {workPermit.employees!.map((e) => (
                    <li key={e.id} className="text-sm border rounded-md p-2">
                      {e.user
                        ? `${e.user.firstName ?? ''} ${e.user.lastName ?? ''}`.trim() || e.user.email || '—'
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
                <ul className="space-y-2">
                  {workPermit.supervisors!.map((s) => {
                    const nm = displayField(s.guest?.name);
                    return (
                      <li key={s.id} className="text-sm border rounded-md p-2">
                        {s.guest?.phone ? `${nm} · ${s.guest.phone}` : nm}
                      </li>
                    );
                  })}
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
                <ul className="space-y-2">
                  {workPermit.hseOfficers!.map((h) => (
                    <li key={h.id} className="text-sm border rounded-md p-2">
                      {h.user
                        ? `${h.user.firstName ?? ''} ${h.user.lastName ?? ''}`.trim() || h.user.email || '—'
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
          {[
            { key: 'tools', title: WORK_PERMIT_SECTION_C_SUB.tools, rows: workPermit.tools, name: (t: any) => t.tool },
            { key: 'machines', title: WORK_PERMIT_SECTION_C_SUB.machines, rows: workPermit.machines, name: (m: any) => m.machine },
            { key: 'materials', title: WORK_PERMIT_SECTION_C_SUB.materials, rows: workPermit.materials, name: (m: any) => m.material },
            { key: 'heavy', title: WORK_PERMIT_SECTION_C_SUB.heavyEquipment, rows: workPermit.heavyEquipment, name: (e: any) => e.heavyEquipment },
          ].map((block) => (
            <Card key={block.key}>
              <CardHeader>
                <WorkPermitSubsectionTitle>{block.title}</WorkPermitSubsectionTitle>
              </CardHeader>
              <CardContent>
                {(block.rows?.length ?? 0) === 0 ? (
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
                      {block.rows!.map((row: any) => {
                        const ent = block.name(row);
                        return (
                          <TableRow key={row.id}>
                            <TableCell>{displayField(ent?.name)}</TableCell>
                            <TableCell>{displayField(ent?.code)}</TableCell>
                            <TableCell className="text-right">{row.quantity}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ))}
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
                      ? `${s.safetyEquipment.name ?? ''}${s.safetyEquipment.code ? ` (${s.safetyEquipment.code})` : ''}`.trim() || '—'
                      : '—'}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </WorkPermitSection>

      {showSectionG && !hideSectionG ? (
        <WorkPermitSection
          id="public-work-permit-section-g"
          title={WORK_PERMIT_SECTIONS.G}
          description={
            classificationContentEnabled
              ? 'Per work classification — risk/equipment/mitigation and HSE guideline narrative where applicable'
              : 'Per work classification — risk, required safety equipment, and master risk mitigation'
          }
        >
          <Card>
            <CardHeader>
              <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_G_SUB.byClassification}</WorkPermitSubsectionTitle>
            </CardHeader>
            <CardContent>
              <WorkPermitSafetyGuidelineDisplay
                classifications={workPermit.classifications}
                showGuidelineNarrative={classificationContentEnabled}
                mitigationsByRiskId={mitigationsByRiskId}
                mitigationsLoadingByRiskId={mitigationsLoadingByRiskId}
                mitigationsErrorByRiskId={mitigationsErrorByRiskId}
              />
            </CardContent>
          </Card>
        </WorkPermitSection>
      ) : null}

      <WorkPermitSection id="public-work-permit-section-f" title={WORK_PERMIT_SECTIONS.F}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_F_SUB.initialPermitGrant}</WorkPermitSubsectionTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Work start date</Label>
                <p className="mt-1">{format(new Date(workPermit.proposedStartDate), 'MMM dd, yyyy')}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Work end date</Label>
                <p className="mt-1">{format(new Date(workPermit.proposedEndDate), 'MMM dd, yyyy')}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Work start time</Label>
                <p className="mt-1">—</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Work end time</Label>
                <p className="mt-1">—</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_F_SUB.permitExtension}</WorkPermitSubsectionTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Extended start date</Label>
                <p className="mt-1">—</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Extended end date</Label>
                <p className="mt-1">—</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </WorkPermitSection>
    </div>
  );
}
