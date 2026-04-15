import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { usePDF } from 'react-to-pdf';
import { format } from 'date-fns';
import { ArrowLeft, Edit, CheckCircle, XCircle, Package, FileText, Download, Send, Ban, FileDown } from 'lucide-react';
import { PPEWithdrawalPDFTemplate } from '../../components/PPEWithdrawalPDFTemplate';
import { buildPdfOptions } from '@/core/lib/pdfExport';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/core/components/ui/dialog';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import { usePPEWithdrawal } from '../../hooks/usePPE';
import { PPEWithdrawalStatus } from '../../types/ppe.types';
import approvalService from '@/modules/master-data/services/approvalService';
import type { ApprovalStatusHistory } from '@/modules/master-data';
import { ApprovalTimelineCard } from '@/modules/risk-assessment/components/ApprovalTimelineCard';
import { APPROVAL_ENTITIES } from '@/shared/constants/approval-entity.constants';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/core/components/ui/table';

const emptyApprovalHistory: ApprovalStatusHistory = {
    history: [],
    nextApprover: null,
    allApprovalLines: [],
    currentStatus: 'UNKNOWN',
};

const PPEWithdrawalDetailPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { withdrawal, isLoading, fetchWithdrawal, submitWithdrawal, approveWithdrawal, rejectWithdrawal, collectWithdrawal, cancelWithdrawal } = usePPEWithdrawal(id || null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [actionDialogOpen, setActionDialogOpen] = useState(false);
    const [actionType, setActionType] = useState<'submit' | 'approve' | 'collect' | 'cancel' | null>(null);
    const [canApprove, setCanApprove] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectNote, setRejectNote] = useState('');
    const [approvalHistory, setApprovalHistory] = useState<ApprovalStatusHistory | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const { toPDF, targetRef } = usePDF(
        buildPdfOptions({
            filename: `ppe-withdrawal-${withdrawal?.withdrawalCode ?? id ?? 'export'}-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`,
        }),
    );

    const handleExportPDF = async () => {
        if (!withdrawal) return;
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

    useEffect(() => {
        if (!id || !withdrawal || withdrawal.status !== PPEWithdrawalStatus.WAITING_APPROVAL) {
            setCanApprove(false);
            return;
        }
        approvalService.checkApprovalRights(id, APPROVAL_ENTITIES.PPE_WITHDRAWAL)
            .then((res: { canApprove?: boolean }) => setCanApprove(Boolean(res?.canApprove)))
            .catch(() => setCanApprove(false));
    }, [id, withdrawal?.status]);

    useEffect(() => {
        const fetchApprovalStatus = async () => {
            if (!id) return;
            setIsLoadingHistory(true);
            try {
                const status = await approvalService.checkApprovalStatus(id, APPROVAL_ENTITIES.PPE_WITHDRAWAL);
                if (status && !(status as unknown as { error?: boolean }).error) {
                    setApprovalHistory(status);
                } else {
                    setApprovalHistory(emptyApprovalHistory);
                }
            } catch (error) {
                console.error('Failed to fetch approval status:', error);
                setApprovalHistory(emptyApprovalHistory);
            } finally {
                setIsLoadingHistory(false);
            }
        };
        fetchApprovalStatus();
    }, [id]);

    const getStatusBadge = (status: PPEWithdrawalStatus) => {
        const statusConfig = {
            [PPEWithdrawalStatus.PENDING]: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-0' },
            [PPEWithdrawalStatus.WAITING_APPROVAL]: { label: 'Waiting Approval', className: 'bg-amber-100 text-amber-800 border-0' },
            [PPEWithdrawalStatus.APPROVED]: { label: 'Approved', className: 'bg-blue-100 text-blue-800 border-0' },
            [PPEWithdrawalStatus.COLLECTED]: { label: 'Collected', className: 'bg-green-100 text-green-800 border-0' },
            [PPEWithdrawalStatus.CANCELLED]: { label: 'Cancelled', className: 'bg-red-100 text-red-800 border-0' },
            [PPEWithdrawalStatus.REJECTED]: { label: 'Rejected', className: 'bg-red-100 text-red-800 border-0' },
        };

        const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800 border-0' };
        return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
    };

    const handleActionClick = (type: 'submit' | 'approve' | 'collect' | 'cancel') => {
        setActionType(type);
        setActionDialogOpen(true);
    };

    const handleRejectClick = () => {
        setRejectNote('');
        setRejectDialogOpen(true);
    };

    const refetchApprovalStatus = async () => {
        if (!id) return;
        try {
            const status = await approvalService.checkApprovalStatus(id, APPROVAL_ENTITIES.PPE_WITHDRAWAL);
            if (status && !(status as unknown as { error?: boolean }).error) {
                setApprovalHistory(status);
            }
        } catch (error) {
            console.error('Failed to refetch approval status:', error);
        }
    };

    const handleRejectConfirm = async () => {
        if (!withdrawal?.id) return;
        setIsProcessing(true);
        try {
            await rejectWithdrawal(withdrawal.id, { notes: rejectNote });
            setRejectDialogOpen(false);
            setRejectNote('');
            if (id) {
                fetchWithdrawal(id);
                refetchApprovalStatus();
            }
        } catch (error) {
            console.error('Failed to reject withdrawal:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleActionConfirm = async () => {
        if (!withdrawal || !actionType) return;

        setIsProcessing(true);
        try {
            switch (actionType) {
                case 'submit':
                    await submitWithdrawal(withdrawal.id);
                    break;
                case 'approve':
                    await approveWithdrawal(withdrawal.id, {});
                    break;
                case 'collect':
                    await collectWithdrawal(withdrawal.id, {});
                    break;
                case 'cancel':
                    await cancelWithdrawal(withdrawal.id, {});
                    break;
            }
            setActionDialogOpen(false);
            setActionType(null);
            if (id) {
                fetchWithdrawal(id);
                refetchApprovalStatus();
            }
        } catch (error) {
            console.error(`Failed to ${actionType} withdrawal:`, error);
        } finally {
            setIsProcessing(false);
        }
    };

    const getActionDialogTitle = () => {
        switch (actionType) {
            case 'submit':
                return 'Submit for Approval';
            case 'approve':
                return 'Approve Withdrawal';
            case 'collect':
                return 'Collect Withdrawal';
            case 'cancel':
                return 'Cancel Withdrawal';
            default:
                return '';
        }
    };

    const getActionDialogDescription = () => {
        switch (actionType) {
            case 'submit':
                return `Submit withdrawal "${withdrawal?.withdrawalCode}" for approval? It will be sent to the configured approver.`;
            case 'approve':
                return `Are you sure you want to approve withdrawal "${withdrawal?.withdrawalCode}"?`;
            case 'collect':
                return `Are you sure you want to mark withdrawal "${withdrawal?.withdrawalCode}" as collected?`;
            case 'cancel':
                return `Are you sure you want to cancel withdrawal "${withdrawal?.withdrawalCode}"? This action cannot be undone.`;
            default:
                return '';
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto py-10">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading withdrawal details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!withdrawal) {
        return (
            <div className="container mx-auto py-10">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <p className="text-gray-600">Withdrawal not found</p>
                        <Button
                            variant="outline"
                            onClick={() => navigate('/ppe/withdrawals')}
                            className="mt-4"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Withdrawals
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const canEdit = false;
    const showSubmitButton = withdrawal.status === PPEWithdrawalStatus.PENDING;
    const showApproveButton = withdrawal.status === PPEWithdrawalStatus.WAITING_APPROVAL && canApprove;
    const showCollectButton = withdrawal.status === PPEWithdrawalStatus.APPROVED;
    const showCancelButton = withdrawal.status === PPEWithdrawalStatus.PENDING;

    return (
        <>
            {/* Hidden PDF template for export */}
            <div
                ref={targetRef}
                style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '210mm' }}
                aria-hidden="true"
            >
                <PPEWithdrawalPDFTemplate
                    withdrawal={withdrawal}
                    approvalHistory={approvalHistory}
                    viewUrl={`${window.location.origin}/ppe/withdrawals/${withdrawal.id}`}
                />
            </div>
            <PageHeader
                title={`Withdrawal: ${withdrawal.withdrawalCode}`}
                subtitle="View withdrawal details and items"
                actions={
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => navigate('/ppe/withdrawals')}
                            disabled={isLoading || isProcessing}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Withdrawals
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleExportPDF}
                            disabled={isLoading || isProcessing || isExportingPDF}
                        >
                            <FileDown className="mr-2 h-4 w-4" />
                            {isExportingPDF ? 'Exporting...' : 'Export PDF'}
                        </Button>
                        {canEdit && (
                            <Button
                                onClick={() => navigate(`/ppe/withdrawals/${id}/edit`)}
                                disabled={isLoading || isProcessing}
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Withdrawal
                            </Button>
                        )}
                        {showSubmitButton && (
                            <Button
                                onClick={() => handleActionClick('submit')}
                                disabled={isLoading || isProcessing}
                                className="bg-amber-600 hover:bg-amber-700"
                            >
                                <Send className="mr-2 h-4 w-4" />
                                Submit for Approval
                            </Button>
                        )}
                        {showApproveButton && (
                            <>
                                <Button
                                    onClick={() => handleActionClick('approve')}
                                    disabled={isLoading || isProcessing}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleRejectClick}
                                    disabled={isLoading || isProcessing}
                                >
                                    <Ban className="mr-2 h-4 w-4" />
                                    Reject
                                </Button>
                            </>
                        )}
                        {showCollectButton && (
                            <Button
                                onClick={() => handleActionClick('collect')}
                                disabled={isLoading || isProcessing}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Collect
                            </Button>
                        )}
                        {showCancelButton && (
                            <Button
                                variant="destructive"
                                onClick={() => handleActionClick('cancel')}
                                disabled={isLoading || isProcessing}
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                        )}
                    </div>
                }
            />

            <div className="container mx-auto py-6 space-y-4 max-w-5xl">
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Package className="h-5 w-5" />
                            Withdrawal Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-medium text-muted-foreground">Withdrawal Code</h3>
                                    <p className="text-sm font-medium">{withdrawal.withdrawalCode}</p>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-sm font-medium text-muted-foreground">Withdrawal Date</h3>
                                    <p className="text-sm">{new Date(withdrawal.withdrawalDate).toLocaleDateString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                                    <div className="text-sm">{getStatusBadge(withdrawal.status)}</div>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-sm font-medium text-muted-foreground">Requested By</h3>
                                    <p className="text-sm">{withdrawal.createdByName || withdrawal.createdBy || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-sm font-medium text-muted-foreground">Requested For</h3>
                                    <p className="text-sm">{withdrawal.requestedForName || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-sm font-medium text-muted-foreground">Department</h3>
                                    <p className="text-sm">{withdrawal.departmentName || withdrawal.departmentId}</p>
                                </div>
                                {withdrawal.jobPositionName && (
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-medium text-muted-foreground">Job Position</h3>
                                        <p className="text-sm">{withdrawal.jobPositionName}</p>
                                    </div>
                                )}
                                {withdrawal.collectedDate && (
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-medium text-muted-foreground">Collected Date</h3>
                                        <p className="text-sm">{new Date(withdrawal.collectedDate).toLocaleString()}</p>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <h3 className="text-sm font-medium text-muted-foreground">Created At</h3>
                                    <p className="text-sm">{new Date(withdrawal.createdAt).toLocaleString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                                    <p className="text-sm">{new Date(withdrawal.updatedAt).toLocaleString()}</p>
                                </div>
                                {withdrawal.notes && (
                                    <div className="space-y-1 col-span-2 md:col-span-3">
                                        <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                                        <p className="text-sm">{withdrawal.notes}</p>
                                    </div>
                                )}
                                {withdrawal.withdrawalLetterUrl && (
                                    <div className="space-y-1 col-span-2 md:col-span-3">
                                        <h3 className="text-sm font-medium text-muted-foreground">Withdrawal Letter</h3>
                                        <a
                                            href={(() => {
                                                const url = withdrawal.withdrawalLetterUrl!;
                                                if (url.startsWith('http://') || url.startsWith('https://')) return url;
                                                if (url.startsWith('/')) return `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${url}`;
                                                if (url.length === 36 && url.includes('-')) return `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/uploads/public/${url}`;
                                                return `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${url}`;
                                            })()}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                                        >
                                            <FileText className="h-4 w-4 shrink-0" />
                                            <span>View Withdrawal Letter</span>
                                            <Download className="h-4 w-4 shrink-0" />
                                        </a>
                                    </div>
                                )}
                            </div>
                            <div className="lg:border-l lg:pl-6 flex flex-col">
                                <ApprovalTimelineCard
                                    approvalHistory={approvalHistory}
                                    isLoading={isLoadingHistory}
                                    assessmentStatus={
                                        [PPEWithdrawalStatus.COLLECTED, PPEWithdrawalStatus.APPROVED, PPEWithdrawalStatus.REJECTED, PPEWithdrawalStatus.CANCELLED].includes(withdrawal.status)
                                            ? 'DONE'
                                            : withdrawal.status
                                    }
                                    entityDepartmentName={withdrawal.departmentName ?? undefined}
                                    entityJobPositionName="Approver"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle>Withdrawal Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {withdrawal.items && withdrawal.items.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-sm">Equipment Name</TableHead>
                                        <TableHead className="text-sm">Type</TableHead>
                                        <TableHead className="text-sm">Size</TableHead>
                                        <TableHead className="text-sm">Requested Qty</TableHead>
                                        <TableHead className="text-sm">Approved Qty</TableHead>
                                        <TableHead className="text-sm">Issued Qty</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {withdrawal.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-sm font-medium">
                                                {item.stockItemEquipmentName || item.stockItemId || '-'}
                                            </TableCell>
                                            <TableCell className="text-sm">{item.stockItemEquipmentType || '-'}</TableCell>
                                            <TableCell className="text-sm">{item.stockItemEquipmentSize || '-'}</TableCell>
                                            <TableCell className="text-sm">{item.requestedQuantity}</TableCell>
                                            <TableCell className="text-sm">{item.approvedQuantity || '-'}</TableCell>
                                            <TableCell className="text-sm">{item.issuedQuantity || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-center text-sm text-muted-foreground py-4">No items found</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <ConfirmDialog
                open={actionDialogOpen}
                onOpenChange={setActionDialogOpen}
                title={getActionDialogTitle()}
                description={getActionDialogDescription()}
                onConfirm={handleActionConfirm}
            />

            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Withdrawal</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Reject withdrawal &quot;{withdrawal?.withdrawalCode}&quot;? Provide a note for the requester (optional but recommended).
                    </p>
                    <div className="space-y-2">
                        <Label htmlFor="reject-note">Note / Reason for rejection</Label>
                        <Textarea
                            id="reject-note"
                            placeholder="Enter reason for rejection..."
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                            rows={3}
                            className="resize-none"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRejectDialogOpen(false)}
                            disabled={isProcessing}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRejectConfirm}
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Rejecting...' : 'Reject'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default PPEWithdrawalDetailPage;

