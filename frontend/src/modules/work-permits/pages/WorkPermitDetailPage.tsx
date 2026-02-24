import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, CheckCircle, XCircle, MessageSquare, Clock, FileText, FileDown } from 'lucide-react';
import { usePDF } from 'react-to-pdf';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import PageHeader from '@/core/components/ui/PageHeader';
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
import { approvalService, APPROVAL_ENTITIES, type ApprovalStatusHistory } from '@/modules/master-data';
import { ApprovalTimelineCard } from '@/modules/risk-assessment/components/ApprovalTimelineCard';

const WorkPermitDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { workPermit, isLoading, fetchWorkPermit } = useWorkPermit(id || null);
  const { submit, approve, reject, requestInfo, extend, close, isLoading: isActionLoading } = useWorkPermitActions();

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

  const { toPDF, targetRef } = usePDF({
    filename: `${workPermit?.code ?? 'work-permit'}-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`,
  });

  const [approveNotes, setApproveNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [extendDate, setExtendDate] = useState('');
  const [extendReason, setExtendReason] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

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
      if (['IN_REVIEW_HSE', 'IN_REVIEW_SECURITY', 'WAITING_APPROVAL', 'IN_REVIEW'].includes(status)) {
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
      await approve(id, approveNotes);
      setApproveDialogOpen(false);
      setApproveNotes('');
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

      <div className="grid gap-6">
        {/* Basic Information and Approval Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Status</Label>
                  <div className="mt-1">
                    <Badge>{workPermit.status.replace(/_/g, ' ')}</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500">Project Name</Label>
                  <p className="mt-1">{workPermit.projectName}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Area</Label>
                  <p className="mt-1">{workPermit.area?.name || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Company</Label>
                  <p className="mt-1">{workPermit.company?.name || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Start Date</Label>
                  <p className="mt-1">{format(new Date(workPermit.proposedStartDate), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <Label className="text-gray-500">End Date</Label>
                  <p className="mt-1">{format(new Date(workPermit.proposedEndDate), 'MMM dd, yyyy')}</p>
                </div>
              </div>
              <div className="lg:border-l lg:pl-6 flex flex-col">
                <ApprovalTimelineCard
                  approvalHistory={approvalHistory}
                  isLoading={isLoadingHistory}
                  assessmentStatus={
                    ['APPROVED', 'REJECTED', 'CLOSED'].includes(workPermit.status) ? 'DONE' : workPermit.status
                  }
                  entityDepartmentName={workPermit.area?.name}
                  entityJobPositionName="Department Head"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Details */}
        <Card>
          <CardHeader>
            <CardTitle>Work Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-500">Work Stages Description</Label>
              <p className="mt-1 whitespace-pre-wrap">{workPermit.workStagesDescription}</p>
            </div>
            <div>
              <Label className="text-gray-500">Job Safety Analysis</Label>
              <p className="mt-1 whitespace-pre-wrap">{workPermit.jobSafetyAnalysis}</p>
            </div>
            {workPermit.workRequirements && (
              <div>
                <Label className="text-gray-500">Work Requirements</Label>
                <p className="mt-1 whitespace-pre-wrap">{workPermit.workRequirements}</p>
              </div>
            )}
            {workPermit.safetyGuideline && (
              <div>
                <Label className="text-gray-500">Safety Guideline</Label>
                <p className="mt-1 whitespace-pre-wrap">{workPermit.safetyGuideline}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workers */}
        {workPermit.workers && workPermit.workers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Workers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {workPermit.workers.map((worker) => (
                  <div key={worker.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">
                        {worker.user
                          ? `${worker.user.firstName ?? ''} ${worker.user.lastName ?? ''}`.trim() || worker.user.email || 'Unknown'
                          : 'Unknown'}
                      </p>
                      {worker.idNumber && <p className="text-sm text-muted-foreground">ID: {worker.idNumber}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
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
