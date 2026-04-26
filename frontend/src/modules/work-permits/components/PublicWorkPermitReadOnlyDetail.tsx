import { useMemo } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/core/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/core/components/ui/card';
import { Label } from '@/core/components/ui/label';
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
import type { RiskMitigation } from '@/modules/risk-assessment/services/riskMitigationService';
import type { WorkPermit } from '../types/work-permit.types';
import { useWorkPermitClassificationContentEnabled } from '../hooks/useWorkPermitClassificationContentEnabled';
import { useWorkPermitClassificationRiskMitigations } from '../hooks/useWorkPermitClassificationRiskMitigations';

const displayField = (v: string | number | boolean | null | undefined) => {
  if (v == null) return '—';
  const s = String(v).trim();
  return s !== '' ? s : '—';
};

type Props = {
  workPermit: WorkPermit;
  hideSectionG?: boolean;
  /** From public GET bundle — avoids unauthenticated /risk-mitigations calls */
  mitigationsByRiskIdPrefetched?: Record<string, RiskMitigation[]>;
};

/**
 * Read-only full permit content for the anonymous public link (no approval/PDF).
 * Mirrors [WorkPermitDetailPage] sections A–F (+ G) for consistency.
 */
export function PublicWorkPermitReadOnlyDetail({
  workPermit,
  hideSectionG = false,
  mitigationsByRiskIdPrefetched,
}: Props) {
  const { enabled: classificationContentEnabled } = useWorkPermitClassificationContentEnabled();
  const {
    mitigationsByRiskId,
    mitigationsLoadingByRiskId,
    mitigationsErrorByRiskId,
  } = useWorkPermitClassificationRiskMitigations(
    workPermit?.classifications,
    mitigationsByRiskIdPrefetched,
  );

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
              {(workPermit.workers?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">No workers listed.</p>
              ) : (
                <div className="space-y-2">
                  {workPermit.workers!.map((worker) => (
                    <div key={worker.id} className="flex items-center justify-between p-2 border rounded-md">
                      <div>
                        <p className="font-medium">
                          {worker.user
                            ? `${worker.user.firstName ?? ''} ${worker.user.lastName ?? ''}`.trim() || worker.user.email || 'Unknown'
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
