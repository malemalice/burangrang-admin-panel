import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Edit, CheckCircle, XCircle, Package, FileText, Download, Send, Ban } from 'lucide-react';
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
import { APPROVAL_ENTITIES } from '@/shared/constants/approval-entity.constants';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/core/components/ui/table';

const PPEWithdrawalDetailPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { withdrawal, isLoading, fetchWithdrawal, submitWithdrawal, approveWithdrawal, rejectWithdrawal, collectWithdrawal, cancelWithdrawal } = usePPEWithdrawal(id || null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [actionDialogOpen, setActionDialogOpen] = useState(false);
    const [actionType, setActionType] = useState<'submit' | 'approve' | 'collect' | 'cancel' | null>(null);
    const [canApprove, setCanApprove] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectNote, setRejectNote] = useState('');

    useEffect(() => {
        if (!id || !withdrawal || withdrawal.status !== PPEWithdrawalStatus.WAITING_APPROVAL) {
            setCanApprove(false);
            return;
        }
        approvalService.checkApprovalRights(id, APPROVAL_ENTITIES.PPE_WITHDRAWAL)
            .then((res: { canApprove?: boolean }) => setCanApprove(Boolean(res?.canApprove)))
            .catch(() => setCanApprove(false));
    }, [id, withdrawal?.status]);

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

    const handleRejectConfirm = async () => {
        if (!withdrawal?.id) return;
        setIsProcessing(true);
        try {
            await rejectWithdrawal(withdrawal.id, { notes: rejectNote });
            setRejectDialogOpen(false);
            setRejectNote('');
            if (id) fetchWithdrawal(id);
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

            <div className="container mx-auto py-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Withdrawal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Withdrawal Code</h3>
                                <p className="mt-1 font-medium">{withdrawal.withdrawalCode}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Withdrawal Date</h3>
                                <p className="mt-1">{new Date(withdrawal.withdrawalDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                                <div className="mt-1">{getStatusBadge(withdrawal.status)}</div>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Requested By</h3>
                                <p className="mt-1">{withdrawal.createdByName || withdrawal.createdBy || 'N/A'}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Requested For</h3>
                                <p className="mt-1">{withdrawal.requestedForName || 'N/A'}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Department</h3>
                                <p className="mt-1">{withdrawal.departmentName || withdrawal.departmentId}</p>
                            </div>
                            {withdrawal.jobPositionName && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Job Position</h3>
                                    <p className="mt-1">{withdrawal.jobPositionName}</p>
                                </div>
                            )}
                            {withdrawal.notes && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                                    <p className="mt-1">{withdrawal.notes}</p>
                                </div>
                            )}
                            {withdrawal.withdrawalLetterUrl && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Withdrawal Letter</h3>
                                    <div className="mt-1">
                                        <a
                                            href={(() => {
                                                const url = withdrawal.withdrawalLetterUrl!;
                                                // If already a full URL, use it
                                                if (url.startsWith('http://') || url.startsWith('https://')) {
                                                    return url;
                                                }
                                                // If starts with /, it's already a path
                                                if (url.startsWith('/')) {
                                                    return `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${url}`;
                                                }
                                                // If it's a UUID (36 chars with dashes), construct proper URL
                                                // Check if it looks like a UUID (contains dashes and is 36 chars)
                                                if (url.length === 36 && url.includes('-')) {
                                                    // This is likely a file ID, but we need accessToken for private files
                                                    // For now, try public endpoint (might need to fetch file metadata to get accessToken)
                                                    return `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/uploads/public/${url}`;
                                                }
                                                // Otherwise, treat as path
                                                return `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${url}`;
                                            })()}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 underline"
                                        >
                                            <FileText className="h-4 w-4" />
                                            <span>View Withdrawal Letter</span>
                                            <Download className="h-4 w-4" />
                                        </a>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Additional Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {withdrawal.collectedDate && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Collected Date</h3>
                                    <p className="mt-1">
                                        {new Date(withdrawal.collectedDate).toLocaleString()}
                                    </p>
                                </div>
                            )}
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Created At</h3>
                                <p className="mt-1">
                                    {new Date(withdrawal.createdAt).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                                <p className="mt-1">
                                    {new Date(withdrawal.updatedAt).toLocaleString()}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Withdrawal Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {withdrawal.items && withdrawal.items.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Equipment Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Size</TableHead>
                                        <TableHead>Requested Qty</TableHead>
                                        <TableHead>Approved Qty</TableHead>
                                        <TableHead>Issued Qty</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {withdrawal.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                {item.stockItemEquipmentName || item.stockItemId || '-'}
                                            </TableCell>
                                            <TableCell>{item.stockItemEquipmentType || '-'}</TableCell>
                                            <TableCell>{item.stockItemEquipmentSize || '-'}</TableCell>
                                            <TableCell>{item.requestedQuantity}</TableCell>
                                            <TableCell>{item.approvedQuantity || '-'}</TableCell>
                                            <TableCell>{item.issuedQuantity || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-center text-gray-500 py-8">No items found</p>
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

