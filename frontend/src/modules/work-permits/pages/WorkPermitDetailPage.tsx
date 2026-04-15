import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, CheckCircle, XCircle, MessageSquare, Clock, FileText, FileDown, PenLine } from 'lucide-react';
import { usePDF } from 'react-to-pdf';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import PageHeader from '@/core/components/ui/PageHeader';
import { buildPdfOptions } from '@/core/lib/pdfExport';
import { useWorkPermit, useWorkPermitActions } from '../hooks/useWorkPermits';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ApprovalTimelineItem } from '../types/work-permit.types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Textarea } from '@/core/components/ui/textarea';
import { Label } from '@/core/components/ui/label';
import { Input } from '@/core/components/ui/input';
import { WorkPermitPDFTemplate } from '../components/WorkPermitPDFTemplate';
import { WorkPermitSection, WorkPermitSubsectionTitle } from '../components/WorkPermitSection';
import {
  WORK_PERMIT_SECTIONS,
  WORK_PERMIT_SECTION_A_SUB,
  WORK_PERMIT_SECTION_B_SUB,
  WORK_PERMIT_SECTION_C_SUB,
  WORK_PERMIT_SECTION_D_SUB,
  WORK_PERMIT_SECTION_E_SUB,
  WORK_PERMIT_SECTION_F_SUB,
} from '../constants/workPermitSections';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { approvalService, APPROVAL_ENTITIES, type ApprovalStatusHistory } from '@/modules/master-data';
import { ApprovalTimelineCard } from '@/modules/risk-assessment/components/ApprovalTimelineCard';
import { useAuth } from '@/core/lib/auth';

const displayField = (v: string | number | boolean | null | undefined) => {
  if (v == null) return '—';
  const s = String(v).trim();
  return s !== '' ? s : '—';
};

const WorkPermitDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { workPermit, isLoading, fetchWorkPermit } = useWorkPermit(id || null);
  const { submit, approve, reject, requestInfo, extend, close, signSk, isLoading: isActionLoading } = useWorkPermitActions();
  const { user: currentUser } = useAuth();

  const createdByLabel = (() => {
    const creator = workPermit?.creator;
    if (!creator) return displayField(workPermit?.createdBy);
    const fullName = `${creator.firstName ?? ''} ${creator.lastName ?? ''}`.trim();
    return displayField(fullName || creator.email || workPermit?.createdBy);
  })();

  const [approvalRights, setApprovalRights] = useState<{
    canApprove: boolean;
    canReject: boolean;
    canRequestInfo: boolean;
    nextApprover: any;
  } | null>(null);

  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [requestInfoDialogOpen, setRequestInfoDialogOpen] = useState(false);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [timeline, setTimeline] = useState<ApprovalTimelineItem[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalStatusHistory | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const { toPDF, targetRef } = usePDF(
    buildPdfOptions({
      filename: `${workPermit?.code ?? 'work-permit'}-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`,
    }),
  );

  const [approveNotes, setApproveNotes] = useState('');
  const [approveSafetyGuideline, setApproveSafetyGuideline] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [extendDate, setExtendDate] = useState('');
  const [extendReason, setExtendReason] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [signSkDialogOpen, setSignSkDialogOpen] = useState(false);
  const [applicantSignature, setApplicantSignature] = useState('');

  useEffect(() => {
    if (id) {
      fetchWorkPermit(id);
      // Fetch timeline (for PDF export)
      import('../services/workPermitService').then((module) => {
        module.default
          .getTimeline(id)
          .then(setTimeline)
          .catch((error) => {
            console.error('Failed to fetch timeline:', error);
          });
      });
    }
  }, [id]);

  // Fetch approval status/history for ApprovalTimelineCard
  useEffect(() => {
    const fetchApprovalStatus = async () => {
      if (!id) return;

      setIsLoadingHistory(true);
      try {
        const approvalStatus = await approvalService.checkApprovalStatus(id, APPROVAL_ENTITIES.WORK_PERMIT);
        if (approvalStatus && !(approvalStatus as { error?: boolean }).error) {
          setApprovalHistory(approvalStatus);
        } else {
          setApprovalHistory({
            history: [],
            nextApprover: null,
            allApprovalLines: [],
            currentStatus: 'UNKNOWN',
          });
        }
      } catch (error) {
        console.error('Failed to fetch approval status:', error);
        setApprovalHistory({
          history: [],
          nextApprover: null,
          allApprovalLines: [],
          currentStatus: 'UNKNOWN',
        });
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchApprovalStatus();
  }, [id]);

  // Fetch approval rights when work permit is loaded
  useEffect(() => {
    if (id && workPermit) {
      const status = workPermit.status;
      // Only check rights if in review status
      if (
        ['IN_REVIEW_PROJECT_OWNER', 'IN_REVIEW_HSE', 'IN_REVIEW_SECURITY', 'WAITING_APPROVAL', 'IN_REVIEW'].includes(
          status,
        )
      ) {
        import('../services/workPermitService').then((module) => {
          module.default
            .checkApprovalRights(id)
            .then(setApprovalRights)
            .catch((error) => {
              console.error('Failed to fetch approval rights:', error);
              setApprovalRights(null);
            });
        });
      } else {
        setApprovalRights(null);
      }
    }
  }, [id, workPermit]);

  const handleSubmitForApproval = async () => {
    if (!id) return;
    try {
      await submit(id);
      // Refresh data immediately to show updated buttons (WP-047)
      await fetchWorkPermit(id);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    try {
      await approve(id, {
        notes: approveNotes,
        safetyGuideline: approveSafetyGuideline || undefined,
      });
      setApproveDialogOpen(false);
      setApproveNotes('');
      setApproveSafetyGuideline('');
      await fetchWorkPermit(id);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleSignSk = async () => {
    if (!id) return;
    try {
      await signSk(id, applicantSignature || undefined);
      setSignSkDialogOpen(false);
      setApplicantSignature('');
      await fetchWorkPermit(id);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleReject = async () => {
    if (!id || !rejectReason) {
      toast.error('Rejection reason is required');
      return;
    }
    try {
      await reject(id, rejectReason, rejectNotes);
      setRejectDialogOpen(false);
      setRejectReason('');
      setRejectNotes('');
      fetchWorkPermit(id);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleRequestInfo = async () => {
    if (!id || !infoMessage) {
      toast.error('Information request message is required');
      return;
    }
    try {
      await requestInfo(id, infoMessage);
      setRequestInfoDialogOpen(false);
      setInfoMessage('');
      fetchWorkPermit(id);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleExtend = async () => {
    if (!id || !extendDate || !extendReason) {
      toast.error('Extension date and reason are required');
      return;
    }

    // Validate that new end date is after existing end date (WP-053)
    if (workPermit) {
      const existingEndDate = new Date(workPermit.proposedEndDate);
      const newEndDate = new Date(extendDate);
      if (newEndDate <= existingEndDate) {
        toast.error(`New end date must be after the current end date (${existingEndDate.toLocaleDateString()})`);
        return;
      }
    }

    try {
      await extend(id, extendDate, extendReason);
      setExtendDialogOpen(false);
      setExtendDate('');
      setExtendReason('');
      fetchWorkPermit(id);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleClose = async () => {
    if (!id) return;
    try {
      await close(id, closeNotes);
      setCloseDialogOpen(false);
      setCloseNotes('');
      fetchWorkPermit(id);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleExportPDF = async () => {
    if (!id || !workPermit) return;
    try {
      setIsExportingPDF(true);
      await new Promise((resolve) => setTimeout(resolve, 200));
      await toPDF();
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const canEdit = workPermit?.status === 'DRAFT' || workPermit?.status === 'NEED_INFO';
  const canSubmit = workPermit?.status === 'DRAFT';
  
  // Permission-based actions using checkApprovalRights result
  const canApprove = approvalRights?.canApprove ?? false;
  const canReject = approvalRights?.canReject ?? false;
  const canRequestInfo = approvalRights?.canRequestInfo ?? false;
  const canSignSk =
    workPermit?.status === 'WAITING_APPLICANT_SIGN' && Boolean(currentUser?.id) && workPermit.createdBy === currentUser.id;
  
  const canExtend = workPermit?.status === 'APPROVED';
  const canClose = ['APPROVED', 'EXTENDED'].includes(workPermit?.status || '');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!workPermit) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Work permit not found</p>
          <Button onClick={() => navigate('/work-permits')} className="mt-4">
            Back to Work Permits
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {workPermit && (
        <div
          ref={targetRef}
          style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '210mm' }}
          aria-hidden="true"
        >
          <WorkPermitPDFTemplate workPermit={workPermit} timeline={timeline} />
        </div>
      )}
      <PageHeader
        title={`Work Permit: ${workPermit.code}`}
        subtitle={workPermit.projectName}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/work-permits')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={isExportingPDF}
            >
              <FileDown className="mr-2 h-4 w-4" />
              {isExportingPDF ? 'Preparing PDF...' : 'Export PDF'}
            </Button>
            {canEdit && (
              <Button onClick={() => navigate(`/work-permits/${workPermit.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Button>
            )}
            {canSubmit && (
              <Button onClick={handleSubmitForApproval} disabled={isActionLoading}>
                Submit for Approval
              </Button>
            )}
            {canApprove && (
              <Button onClick={() => setApproveDialogOpen(true)} disabled={isActionLoading}>
                <CheckCircle className="mr-2 h-4 w-4" /> Approve
              </Button>
            )}
            {canReject && (
              <Button variant="destructive" onClick={() => setRejectDialogOpen(true)} disabled={isActionLoading}>
                <XCircle className="mr-2 h-4 w-4" /> Reject
              </Button>
            )}
            {canRequestInfo && (
              <Button variant="outline" onClick={() => setRequestInfoDialogOpen(true)} disabled={isActionLoading}>
                <MessageSquare className="mr-2 h-4 w-4" /> Request Info
              </Button>
            )}
            {canSignSk && (
              <Button onClick={() => setSignSkDialogOpen(true)} disabled={isActionLoading}>
                <PenLine className="mr-2 h-4 w-4" /> Sign SK
              </Button>
            )}
            {canExtend && (
              <Button variant="outline" onClick={() => setExtendDialogOpen(true)} disabled={isActionLoading}>
                <Clock className="mr-2 h-4 w-4" /> Extend
              </Button>
            )}
            {canClose && (
              <Button variant="outline" onClick={() => setCloseDialogOpen(true)} disabled={isActionLoading}>
                <FileText className="mr-2 h-4 w-4" /> Close
              </Button>
            )}
          </div>
        }
      />

      <div className="max-w-4xl mx-auto space-y-6 mt-6">
        <WorkPermitSection
          id="work-permit-detail-approval-timeline"
          title={WORK_PERMIT_SECTION_F_SUB.approvalTimeline}
        >
          <Card>
            <CardContent className="pt-6 min-h-[120px]">
              <ApprovalTimelineCard
                approvalHistory={approvalHistory}
                isLoading={isLoadingHistory}
                assessmentStatus={
                  ['APPROVED', 'REJECTED', 'CLOSED'].includes(workPermit.status) ? 'DONE' : workPermit.status
                }
                entityDepartmentName={workPermit.area?.name}
                entityJobPositionName="Department Head"
              />
            </CardContent>
          </Card>
        </WorkPermitSection>

        {workPermit.status === 'WAITING_APPLICANT_SIGN' && (
          <WorkPermitSection
            id="work-permit-detail-section-sk-ack"
            title="Safety Guideline Acknowledgment"
            description="Review the safety guideline authored by HSE before signing."
          >
            <Card>
              <CardHeader>
                <WorkPermitSubsectionTitle>Safety Guideline (SK)</WorkPermitSubsectionTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm whitespace-pre-wrap">{displayField(workPermit.safetyGuideline)}</p>
                <p className="text-xs text-muted-foreground">
                  Status: waiting applicant signature before final security approval.
                </p>
              </CardContent>
            </Card>
          </WorkPermitSection>
        )}

        <WorkPermitSection id="work-permit-detail-section-a" title={WORK_PERMIT_SECTIONS.A}>
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

        <WorkPermitSection id="work-permit-detail-section-b" title={WORK_PERMIT_SECTIONS.B}>
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
                <div>
                  <Label className="text-muted-foreground">Job Safety Analysis</Label>
                  <p className="mt-1 whitespace-pre-wrap">{displayField(workPermit.jobSafetyAnalysis)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Work Requirements</Label>
                  <p className="mt-1 whitespace-pre-wrap">{displayField(workPermit.workRequirements)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Safety Guideline</Label>
                  <p className="mt-1 whitespace-pre-wrap">{displayField(workPermit.safetyGuideline)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Safety guideline acknowledged</Label>
                  <p className="mt-1">{workPermit.acknowledgedSafetyGuideline ? 'Yes' : 'No'}</p>
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
                <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_B_SUB.professions}</WorkPermitSubsectionTitle>
              </CardHeader>
              <CardContent>
                {(workPermit.professions?.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">No professions listed.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Profession</TableHead>
                        <TableHead className="w-24 text-right">Qty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workPermit.professions!.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>
                            {displayField(p.profession?.name)} ({displayField(p.profession?.code)})
                          </TableCell>
                          <TableCell className="text-right">{p.quantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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

        <WorkPermitSection id="work-permit-detail-section-c" title={WORK_PERMIT_SECTIONS.C}>
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

        <WorkPermitSection id="work-permit-detail-section-d" title={WORK_PERMIT_SECTIONS.D}>
          <Card>
            <CardHeader>
              <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_D_SUB.hazards}</WorkPermitSubsectionTitle>
            </CardHeader>
            <CardContent>
              {(workPermit.hazards?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">No hazard rows.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Potential risk</TableHead>
                      <TableHead>Worksafe method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workPermit.hazards!.map((h, i) => (
                      <TableRow key={h.id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="whitespace-pre-wrap">{displayField(h.hazardName)}</TableCell>
                        <TableCell className="whitespace-pre-wrap">{displayField(h.description)}</TableCell>
                        <TableCell className="whitespace-pre-wrap">{displayField(h.controlMeasure)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </WorkPermitSection>

        <WorkPermitSection id="work-permit-detail-section-e" title={WORK_PERMIT_SECTIONS.E}>
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

        <WorkPermitSection id="work-permit-detail-section-f" title={WORK_PERMIT_SECTIONS.F}>
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
                <div>
                  <Label className="text-muted-foreground">Extended start time</Label>
                  <p className="mt-1">—</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Extended end time</Label>
                  <p className="mt-1">—</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <WorkPermitSubsectionTitle>{WORK_PERMIT_SECTION_F_SUB.workResultVerification}</WorkPermitSubsectionTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Work result status</Label>
                  <p className="mt-1">—</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="mt-1">—</p>
                </div>
              </CardContent>
            </Card>

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
                          <TableCell className="whitespace-pre-wrap">{displayField(a.description)}</TableCell>
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

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Work Permit</DialogTitle>
            <DialogDescription>Add approval notes (optional)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Notes</Label>
              <Textarea
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                placeholder="Optional approval notes..."
              />
            </div>
            {workPermit?.status === 'IN_REVIEW_HSE' && (
              <div>
                <Label>Safety Guideline (SK)</Label>
                <Textarea
                  value={approveSafetyGuideline}
                  onChange={(e) => setApproveSafetyGuideline(e.target.value)}
                  placeholder="Write safety terms and conditions for applicant acknowledgment..."
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isActionLoading}>
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sign SK Dialog */}
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
              <div className="rounded-md border p-3 text-sm whitespace-pre-wrap bg-muted/30">
                {displayField(workPermit?.safetyGuideline)}
              </div>
            </div>
            <div>
              <Label>Signature / Acknowledgment (optional)</Label>
              <Input
                value={applicantSignature}
                onChange={(e) => setApplicantSignature(e.target.value)}
                placeholder="Type your name or signature token"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignSkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSignSk} disabled={isActionLoading}>
              Sign & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Work Permit</DialogTitle>
            <DialogDescription>Please provide a reason for rejection</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason *</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Rejection reason..."
                required
              />
            </div>
            <div>
              <Label>Additional Notes</Label>
              <Textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Optional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isActionLoading || !rejectReason}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Info Dialog */}
      <Dialog open={requestInfoDialogOpen} onOpenChange={setRequestInfoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Additional Information</DialogTitle>
            <DialogDescription>Request additional information from the requester</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Message *</Label>
              <Textarea
                value={infoMessage}
                onChange={(e) => setInfoMessage(e.target.value)}
                placeholder="What information is needed?"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestInfoDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestInfo} disabled={isActionLoading || !infoMessage}>
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Dialog */}
      <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Work Permit</DialogTitle>
            <DialogDescription>Extend the end date of this work permit</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New End Date *</Label>
              <Input
                type="date"
                value={extendDate}
                onChange={(e) => setExtendDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Reason *</Label>
              <Textarea
                value={extendReason}
                onChange={(e) => setExtendReason(e.target.value)}
                placeholder="Reason for extension..."
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExtend} disabled={isActionLoading || !extendDate || !extendReason}>
              Extend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Work Permit</DialogTitle>
            <DialogDescription>Mark this work permit as completed</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Closing Notes</Label>
              <Textarea
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                placeholder="Optional closing notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleClose} disabled={isActionLoading}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkPermitDetailPage;
