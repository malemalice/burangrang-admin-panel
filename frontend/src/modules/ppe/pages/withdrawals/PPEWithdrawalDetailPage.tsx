import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Edit, CheckCircle, XCircle, Package } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { usePPEWithdrawal } from '../../hooks/usePPE';
import { PPEWithdrawalStatus } from '../../types/ppe.types';
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
    const { withdrawal, isLoading, fetchWithdrawal, approveWithdrawal, collectWithdrawal, cancelWithdrawal } = usePPEWithdrawal(id || null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [actionDialogOpen, setActionDialogOpen] = useState(false);
    const [actionType, setActionType] = useState<'approve' | 'collect' | 'cancel' | null>(null);

    const getStatusBadge = (status: PPEWithdrawalStatus) => {
        const statusConfig = {
            [PPEWithdrawalStatus.PENDING]: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-0' },
            [PPEWithdrawalStatus.APPROVED]: { label: 'Approved', className: 'bg-blue-100 text-blue-800 border-0' },
            [PPEWithdrawalStatus.COLLECTED]: { label: 'Collected', className: 'bg-green-100 text-green-800 border-0' },
            [PPEWithdrawalStatus.CANCELLED]: { label: 'Cancelled', className: 'bg-red-100 text-red-800 border-0' },
        };

        const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800 border-0' };
        return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
    };

    const handleActionClick = (type: 'approve' | 'collect' | 'cancel') => {
        setActionType(type);
        setActionDialogOpen(true);
    };

    const handleActionConfirm = async () => {
        if (!withdrawal || !actionType) return;

        setIsProcessing(true);
        try {
            switch (actionType) {
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

    const canEdit = withdrawal.status === PPEWithdrawalStatus.PENDING;
    const canApprove = withdrawal.status === PPEWithdrawalStatus.PENDING;
    const canCollect = withdrawal.status === PPEWithdrawalStatus.APPROVED;
    const canCancel = withdrawal.status === PPEWithdrawalStatus.PENDING || withdrawal.status === PPEWithdrawalStatus.APPROVED;

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
                        {canApprove && (
                            <Button
                                onClick={() => handleActionClick('approve')}
                                disabled={isLoading || isProcessing}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                            </Button>
                        )}
                        {canCollect && (
                            <Button
                                onClick={() => handleActionClick('collect')}
                                disabled={isLoading || isProcessing}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Collect
                            </Button>
                        )}
                        {canCancel && (
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
                                <h3 className="text-sm font-medium text-gray-500">Requested For</h3>
                                <p className="mt-1">{withdrawal.requestedForName || 'N/A'}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Department</h3>
                                <p className="mt-1">{withdrawal.departmentId}</p>
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
                                                {item.stockItemId || '-'}
                                            </TableCell>
                                            <TableCell>-</TableCell>
                                            <TableCell>-</TableCell>
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
        </>
    );
};

export default PPEWithdrawalDetailPage;

