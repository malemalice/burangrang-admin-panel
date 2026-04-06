import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  FileEdit,
  ArrowLeft,
  FileDown,
  FileText,
  Image,
  Loader2,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Circle,
} from 'lucide-react';
import api from '@/core/lib/api';
import { usePDF } from 'react-to-pdf';

import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import { Separator } from '@/core/components/ui/separator';
import PageHeader from '@/core/components/ui/PageHeader';
import { ApprovalStatus } from '@/core/lib/types';

import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';
import approvalService, { type ApprovalStatusHistory } from '@/modules/master-data/services/approvalService';
import { APPROVAL_ENTITIES } from '@/shared/constants/approval-entity.constants';

import { dispatchOrderService } from '../../services/wasteManagementService';
import { DispatchOrder } from '../../types/waste-management.types';
import { DispatchOrderPDFTemplate } from '../../components/DispatchOrderPDFTemplate';
import { ApprovalDialog } from '../../components/ApprovalDialog';

const APPROVAL_FIELD_MARKERS = {
  FROM_ENTITY_DEPARTMENT: '@ENTITY_DEPARTMENT',
  FROM_ENTITY_JOB_POSITION: '@ENTITY_JOB_POSITION',
} as const;

function getApprovalLineLabel(value: string, fallback: string): string {
  if (value === APPROVAL_FIELD_MARKERS.FROM_ENTITY_DEPARTMENT) return 'Dynamic: From Entity Data';
  if (value === APPROVAL_FIELD_MARKERS.FROM_ENTITY_JOB_POSITION) return 'Dynamic: From Entity Data (Department Head)';
  return fallback;
}

function getStatusBadge(status?: string) {
  switch (status) {
    case GeneralStatusEnum.DRAFT:
      return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">Draft</Badge>;
    case GeneralStatusEnum.SCHEDULED:
      return <Badge variant="outline" className="bg-sky-100 text-sky-800 border-sky-300">Scheduled</Badge>;
    case GeneralStatusEnum.OPEN:
      return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">Open</Badge>;
    case GeneralStatusEnum.WAITING_APPROVAL:
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Waiting Approval</Badge>;
    case GeneralStatusEnum.DONE:
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Done</Badge>;
    case GeneralStatusEnum.REJECTED:
      return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Rejected</Badge>;
    default:
      return status ? <Badge variant="outline">{status}</Badge> : null;
  }
}

export default function DispatchOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [dispatchOrder, setDispatchOrder] = useState<DispatchOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [approvalHistory, setApprovalHistory] = useState<ApprovalStatusHistory | null>(null);
  const [canApprove, setCanApprove] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalInitialStatus, setApprovalInitialStatus] = useState<ApprovalStatus>(ApprovalStatus.APPROVED);
  const [approvalHistoryForPDF, setApprovalHistoryForPDF] = useState<ApprovalStatusHistory | null>(null);

  const { toPDF, targetRef } = usePDF({
    filename: dispatchOrder
      ? `${dispatchOrder.dispatchCode}-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`
      : 'dispatch-order.pdf',
  });

  const fetchApprovalData = useCallback(async (orderId: string) => {
    setIsLoadingHistory(true);
    try {
      const [historyResult, rightsResult] = await Promise.allSettled([
        approvalService.checkApprovalStatus(orderId, APPROVAL_ENTITIES.DISPATCH_ORDER),
        approvalService.checkApprovalRights(orderId, APPROVAL_ENTITIES.DISPATCH_ORDER),
      ]);
      if (historyResult.status === 'fulfilled') {
        setApprovalHistory(historyResult.value);
      }
      if (rightsResult.status === 'fulfilled') {
        setCanApprove(rightsResult.value?.canApprove ?? false);
      }
    } catch {
      // approval data is optional
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const response = await dispatchOrderService.getById(id);
      const data = response.data as DispatchOrder;
      setDispatchOrder(data);
      await fetchApprovalData(id);
    } catch {
      toast.error('Failed to fetch dispatch order');
      navigate('/waste-management/dispatch-orders');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate, fetchApprovalData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!dispatchOrder || !id || searchParams.get('print') !== 'true') return;

    let cancelled = false;
    const run = async () => {
      try {
        const fresh = await approvalService
          .checkApprovalStatus(id, APPROVAL_ENTITIES.DISPATCH_ORDER)
          .catch(() => null);
        if (!cancelled && fresh) {
          setApprovalHistoryForPDF(fresh);
        }
        await new Promise((r) => setTimeout(r, 200));
        if (cancelled) return;
        await toPDF();
        toast.success('PDF exported successfully');
      } catch {
        if (!cancelled) toast.error('Failed to export PDF');
      } finally {
        if (!cancelled) {
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.delete('print');
              return next;
            },
            { replace: true },
          );
        }
      }
    };

    const timer = setTimeout(() => void run(), 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [dispatchOrder, id, searchParams, setSearchParams, toPDF]);

  const handleExportPDF = async () => {
    if (!id) return;
    try {
      const fresh = await approvalService
        .checkApprovalStatus(id, APPROVAL_ENTITIES.DISPATCH_ORDER)
        .catch(() => null);
      if (fresh) setApprovalHistoryForPDF(fresh);
      await new Promise((r) => setTimeout(r, 200));
      await toPDF();
      toast.success('PDF exported successfully');
    } catch {
      toast.error('Failed to export PDF');
    }
  };

  const handleRequestApproval = async () => {
    if (!id || !dispatchOrder) return;
    try {
      setIsUpdatingStatus(true);
      await dispatchOrderService.update(id, { status: GeneralStatusEnum.WAITING_APPROVAL });
      toast.success('Approval requested successfully');
      await fetchData();
    } catch {
      toast.error('Failed to request approval');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleApprovalSubmitted = async () => {
    if (!id) return;
    await fetchData();
  };

  const status = dispatchOrder?.status as GeneralStatusEnum | undefined;
  const isDone = status === GeneralStatusEnum.DONE;
  const allApprovals =
    approvalHistory?.history
      ?.slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) ?? [];
  const hasNoApprovalWorkflow =
    !approvalHistory ||
    !approvalHistory.allApprovalLines ||
    approvalHistory.allApprovalLines.length === 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!dispatchOrder) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Dispatch Order: ${dispatchOrder.dispatchCode}`}
        subtitle={`Created on ${format(new Date(dispatchOrder.createdAt), 'dd MMM yyyy')}`}
        actions={
          <div className="flex gap-2 flex-wrap">
            {/* Workflow action buttons */}
            {(status === GeneralStatusEnum.DRAFT || status === GeneralStatusEnum.OPEN) && (
              <Button variant="default" onClick={handleRequestApproval} disabled={isUpdatingStatus}>
                <Send className="h-4 w-4 mr-2" />
                {isUpdatingStatus ? 'Requesting...' : 'Request Approval'}
              </Button>
            )}

            {status === GeneralStatusEnum.WAITING_APPROVAL && canApprove && (
              <>
                <Button
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setApprovalInitialStatus(ApprovalStatus.APPROVED);
                    setIsApprovalModalOpen(true);
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setApprovalInitialStatus(ApprovalStatus.REJECTED);
                    setIsApprovalModalOpen(true);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </>
            )}

            {/* Standard actions */}
            <Button variant="outline" size="sm" onClick={() => navigate('/waste-management/dispatch-orders')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <FileDown className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            {status !== GeneralStatusEnum.DONE && status !== GeneralStatusEnum.WAITING_APPROVAL && (
                <Button size="sm" onClick={() => navigate(`/waste-management/dispatch-orders/${id}/edit`)}>
                  <FileEdit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
          </div>
        }
      />

      {/* PDF Template — hidden, used for export only */}
      <div
        ref={targetRef}
        style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '210mm' }}
        aria-hidden="true"
      >
        <DispatchOrderPDFTemplate
          dispatchOrder={dispatchOrder}
          approvalHistory={approvalHistoryForPDF ?? approvalHistory}
        />
      </div>

      <div className="w-full max-w-none space-y-6">
        {/* Order Details */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="min-w-0 flex-1 space-y-1.5">
              <CardTitle>Order Details</CardTitle>
              <CardDescription>Dispatch information and attachments</CardDescription>
            </div>
            <div className="flex-shrink-0 pt-0.5">{getStatusBadge(status)}</div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Document number</p>
                <p className="font-mono">{dispatchOrder.dispatchCode}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Dispatch Date</p>
                <p>{format(new Date(dispatchOrder.dispatchDate), 'dd MMM yyyy, HH:mm')}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Quantity (kg)</p>
                <p className="font-semibold">
                  {Number(dispatchOrder.quantity).toLocaleString('id-ID')} kg
                </p>
              </div>
              {dispatchOrder.memo && (
                <div className="space-y-2 md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Memo</p>
                  <p className="whitespace-pre-wrap">{dispatchOrder.memo}</p>
                </div>
              )}
              {dispatchOrder.attachments && dispatchOrder.attachments.length > 0 && (
                <div className="space-y-2 md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Attachments</p>
                  <ul className="space-y-2">
                    {dispatchOrder.attachments
                      .slice()
                      .sort((a, b) => a.order - b.order)
                      .map((att) => {
                        const label = att.fileName ?? att.fileUrl.split('/').pop() ?? 'File';
                        const isPdf = label.toLowerCase().endsWith('.pdf') || att.fileUrl.toLowerCase().includes('pdf');
                        const href = att.fileUrl.startsWith('http')
                          ? att.fileUrl
                          : `${api.defaults.baseURL ?? ''}${att.fileUrl.startsWith('/') ? '' : '/'}${att.fileUrl}`;
                        return (
                          <li key={att.id ?? att.fileUrl}>
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                              {isPdf ? (
                                <FileText className="h-4 w-4 shrink-0" />
                              ) : (
                                <Image className="h-4 w-4 shrink-0" />
                              )}
                              {label}
                            </a>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Ordered By</p>
                <p>
                  {dispatchOrder.orderer
                    ? `${dispatchOrder.orderer.firstName} ${dispatchOrder.orderer.lastName}`
                    : 'N/A'}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Created By</p>
                <p>
                  {dispatchOrder.creator
                    ? `${dispatchOrder.creator.firstName} ${dispatchOrder.creator.lastName}`
                    : 'N/A'}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Created At</p>
                <p>{format(new Date(dispatchOrder.createdAt), 'dd MMM yyyy, HH:mm')}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p>{format(new Date(dispatchOrder.updatedAt), 'dd MMM yyyy, HH:mm')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approval Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Approval Timeline</CardTitle>
            <CardDescription>Track the approval progress and workflow</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="flex items-center gap-3 py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading approval timeline...</span>
              </div>
            ) : hasNoApprovalWorkflow ? (
              <div className="flex items-center gap-3 p-4 border rounded-md bg-muted/20">
                <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">No approval workflow configured</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure in Master Data → Master Approvals (entity: DISPATCH_ORDER).
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                <div className="space-y-4">
                  {/* Completed approval actions */}
                  {allApprovals.map((approval) => {
                    const isApproved = approval.status === 'APPROVED';
                    const isRejected = approval.status === 'REJECTED';
                    return (
                      <div key={approval.id} className="relative pl-8">
                        <div className="absolute left-0 w-8 flex items-center justify-center">
                          <div
                            className={`w-3 h-3 rounded-full border-2 border-background ${
                              isApproved ? 'bg-green-500' : isRejected ? 'bg-red-500' : 'bg-yellow-500'
                            }`}
                          />
                        </div>
                        <div className="bg-card border rounded-lg p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              {isApproved ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : isRejected ? (
                                <XCircle className="h-4 w-4 text-red-600" />
                              ) : (
                                <Clock className="h-4 w-4 text-yellow-600" />
                              )}
                              <Badge
                                variant="outline"
                                className={`text-xs font-medium border ${
                                  isApproved
                                    ? 'bg-green-100 text-green-800 border-green-200'
                                    : isRejected
                                    ? 'bg-red-100 text-red-800 border-red-200'
                                    : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                }`}
                              >
                                {approval.status}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(approval.createdAt), 'dd MMM yyyy HH:mm')}
                            </span>
                          </div>
                          {approval.notes && (
                            <p className="text-xs text-muted-foreground mb-3">{approval.notes}</p>
                          )}
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                            <span className="text-muted-foreground">
                              By: <span className="font-medium text-foreground">{approval.creator.name}</span>
                            </span>
                            <span className="text-muted-foreground">
                              Dept: <span className="font-medium text-foreground">{approval.department.name}</span>
                            </span>
                            <span className="text-muted-foreground">
                              Pos: <span className="font-medium text-foreground">{approval.jobPosition.name}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Pending / current approval lines */}
                  {!isDone &&
                    approvalHistory.allApprovalLines
                      .filter((line) => line.status !== 'completed')
                      .map((line) => {
                        const isCurrent = line.status === 'current';
                        return (
                          <div key={`line-${line.line}`} className="relative pl-8">
                            <div className="absolute left-0 w-8 flex items-center justify-center">
                              {isCurrent ? (
                                <div className="w-3 h-3 rounded-full border-2 border-background bg-blue-500 animate-pulse" />
                              ) : (
                                <Circle className="w-3 h-3 text-muted-foreground" />
                              )}
                            </div>
                            <div
                              className={`rounded-lg p-4 border ${
                                isCurrent
                                  ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                                  : 'bg-muted/20 border-dashed opacity-60'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                {isCurrent && (
                                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                )}
                                <p
                                  className={`text-xs font-semibold ${
                                    isCurrent
                                      ? 'text-blue-900 dark:text-blue-100'
                                      : 'text-muted-foreground'
                                  }`}
                                >
                                  {isCurrent ? 'Waiting for Approval' : 'Pending'}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                <span
                                  className={
                                    isCurrent
                                      ? 'text-blue-700 dark:text-blue-300'
                                      : 'text-muted-foreground'
                                  }
                                >
                                  Dept:{' '}
                                  <span
                                    className={`font-medium ${
                                      isCurrent
                                        ? 'text-blue-900 dark:text-blue-100'
                                        : 'text-foreground'
                                    }`}
                                  >
                                    {getApprovalLineLabel(line.department.id, line.department.name)}
                                  </span>
                                </span>
                                <span
                                  className={
                                    isCurrent
                                      ? 'text-blue-700 dark:text-blue-300'
                                      : 'text-muted-foreground'
                                  }
                                >
                                  Pos:{' '}
                                  <span
                                    className={`font-medium ${
                                      isCurrent
                                        ? 'text-blue-900 dark:text-blue-100'
                                        : 'text-foreground'
                                    }`}
                                  >
                                    {getApprovalLineLabel(line.jobPosition.id, line.jobPosition.name)}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Approval Dialog */}
      {id && (
        <ApprovalDialog
          open={isApprovalModalOpen}
          onOpenChange={setIsApprovalModalOpen}
          dispatchOrderId={id}
          onApprovalSubmitted={handleApprovalSubmitted}
          initialStatus={approvalInitialStatus}
        />
      )}
    </div>
  );
}
