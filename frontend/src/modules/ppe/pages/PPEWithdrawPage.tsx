import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, CheckCircle, XCircle, Package, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import { Badge } from '@/core/components/ui/badge';
import DataTable from '@/core/components/ui/data-table/DataTable';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { usePPEWithdrawals } from '../hooks/usePPE';
import { PPEWithdrawal, PPEWithdrawalSearchParams, PPEWithdrawalStatus } from '../types/ppe.types';
import { FilterField } from '@/core/components/ui/filter-drawer';
import { departmentService, type Department } from '@/modules/master-data';

const PPEWithdrawPage = () => {
    const navigate = useNavigate();
    const { withdrawals, totalWithdrawals, isLoading, fetchWithdrawals, deleteWithdrawal } = usePPEWithdrawals();
    const [pageIndex, setPageIndex] = useState(0);
    const [limit, setLimit] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [withdrawalToDelete, setWithdrawalToDelete] = useState<PPEWithdrawal | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);

    // Fetch departments for filter
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await departmentService.getDepartments({ page: 1, limit: 1000, options: true });
                setDepartments(response.data);
            } catch (error) {
                console.error('Failed to fetch departments:', error);
            }
        };
        fetchDepartments();
    }, []);

    const filterFields: FilterField[] = useMemo(() => [
        {
            id: 'withdrawalCode',
            label: 'Withdrawal Code',
            type: 'text',
        },
        {
            id: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { label: 'Pending', value: 'PENDING' },
                { label: 'Approved', value: 'APPROVED' },
                { label: 'Collected', value: 'COLLECTED' },
                { label: 'Cancelled', value: 'CANCELLED' },
            ],
        },
        {
            id: 'departmentId',
            label: 'Department',
            type: 'select',
            options: departments.map((dept) => ({
                label: dept.name,
                value: dept.id,
            })),
        },
        {
            id: 'withdrawalDateFrom',
            label: 'Withdrawal Date From',
            type: 'date',
        },
        {
            id: 'withdrawalDateTo',
            label: 'Withdrawal Date To',
            type: 'date',
        },
    ], []);

    const loadWithdrawals = useCallback(() => {
        const params: PPEWithdrawalSearchParams = {
            page: pageIndex + 1,
            limit,
            sortBy: 'createdAt',
            sortOrder: 'desc',
            search: searchTerm,
            status: activeFilters.status?.value as PPEWithdrawalStatus | undefined,
            departmentId: activeFilters.departmentId?.value,
            withdrawalDateFrom: activeFilters.withdrawalDateFrom?.value,
            withdrawalDateTo: activeFilters.withdrawalDateTo?.value,
        };
        fetchWithdrawals(params);
    }, [pageIndex, limit, searchTerm, activeFilters, fetchWithdrawals]);

    useEffect(() => {
        loadWithdrawals();
    }, [loadWithdrawals]);

    const handleSearch = useCallback((term: string) => {
        setSearchTerm(term);
        setPageIndex(0);
    }, []);

    const handleApplyFilters = useCallback((filterValues: any[]) => {
        const newFilters: Record<string, { value: any; label: string }> = {};
        filterValues.forEach((filter) => {
            newFilters[filter.id] = { value: filter.value, label: filter.label || filter.id };
        });
        setActiveFilters(newFilters);
        setPageIndex(0);
    }, []);

    const handleDeleteClick = useCallback((withdrawal: PPEWithdrawal, event?: React.MouseEvent) => {
        // Only allow delete for PENDING or CANCELLED status
        if (withdrawal.status !== PPEWithdrawalStatus.PENDING && withdrawal.status !== PPEWithdrawalStatus.CANCELLED) {
            return;
        }
        event?.stopPropagation();
        setOpenDropdownId(null); // Explicitly close the dropdown
        setWithdrawalToDelete(withdrawal);
        setDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!withdrawalToDelete) return;
        try {
            await deleteWithdrawal(withdrawalToDelete.id);
            setOpenDropdownId(null); // Ensure dropdown is closed
            loadWithdrawals();
        } catch (error) {
            // Error already handled in hook with toast notification
        } finally {
            setDeleteDialogOpen(false);
            setWithdrawalToDelete(null);
        }
    }, [withdrawalToDelete, deleteWithdrawal, loadWithdrawals]);

    const handleDialogCancel = useCallback(() => {
        setDeleteDialogOpen(false);
        setWithdrawalToDelete(null);
        setOpenDropdownId(null); // Ensure dropdown is closed
    }, []);

    const getStatusBadge = useCallback((status: PPEWithdrawalStatus) => {
        const variants: Record<PPEWithdrawalStatus, { className: string; label: string }> = {
            PENDING: { className: 'bg-yellow-100 text-yellow-800 border-0', label: 'Pending' },
            APPROVED: { className: 'bg-blue-100 text-blue-800 border-0', label: 'Approved' },
            COLLECTED: { className: 'bg-green-100 text-green-800 border-0', label: 'Collected' },
            CANCELLED: { className: 'bg-red-100 text-red-800 border-0', label: 'Cancelled' },
        };
        const variant = variants[status] || variants.PENDING;
        return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
    }, []);

    const columns = useMemo(() => [
        {
            id: 'withdrawalCode',
            header: 'Withdrawal Code',
            cell: (withdrawal: PPEWithdrawal) => (
                <div className="font-medium">{withdrawal.withdrawalCode}</div>
            ),
            isSortable: true,
        },
        {
            id: 'withdrawalDate',
            header: 'Withdrawal Date',
            cell: (withdrawal: PPEWithdrawal) => (
                <div>{new Date(withdrawal.withdrawalDate).toLocaleDateString()}</div>
            ),
            isSortable: true,
        },
        {
            id: 'requestedFor',
            header: 'Requested For',
            cell: (withdrawal: PPEWithdrawal) => (
                <div>{withdrawal.requestedForName || 'N/A'}</div>
            ),
            isSortable: false,
        },
        {
            id: 'items',
            header: 'Items',
            cell: (withdrawal: PPEWithdrawal) => (
                <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>{withdrawal.items?.length || 0} items</span>
                </div>
            ),
            isSortable: false,
        },
        {
            id: 'status',
            header: 'Status',
            cell: (withdrawal: PPEWithdrawal) => getStatusBadge(withdrawal.status),
            isSortable: true,
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: (withdrawal: PPEWithdrawal) => {
                const canDelete = withdrawal.status === PPEWithdrawalStatus.PENDING || withdrawal.status === PPEWithdrawalStatus.CANCELLED;
                return (
                    <DropdownMenu
                        open={openDropdownId === withdrawal.id}
                        onOpenChange={(open) => {
                            setOpenDropdownId(open ? withdrawal.id : null);
                        }}
                    >
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/ppe/withdrawals/${withdrawal.id}`)}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            {canDelete && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={(e) => handleDeleteClick(withdrawal, e)}
                                        className="text-red-600 focus:text-red-600"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
            isSortable: false,
        },
    ], [openDropdownId, navigate, handleDeleteClick, getStatusBadge]);

    return (
        <>
            <PageHeader
                title="PPE Withdrawals"
                subtitle="Manage PPE withdrawal requests"
                actions={
                    <Button onClick={() => navigate('/ppe/withdrawals/new')}>
                        <Plus className="mr-2 h-4 w-4" /> New Withdrawal
                    </Button>
                }
            />

            <DataTable
                columns={columns}
                data={withdrawals}
                isLoading={isLoading}
                pagination={{
                    pageIndex,
                    limit,
                    pageCount: Math.ceil(totalWithdrawals / limit),
                    onPageChange: setPageIndex,
                    onPageSizeChange: setLimit,
                    total: totalWithdrawals,
                }}
                filterFields={filterFields}
                onSearch={handleSearch}
                onApplyFilters={handleApplyFilters}
                activeFilters={activeFilters}
            />

            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        handleDialogCancel();
                    }
                }}
                title="Delete PPE Withdrawal"
                description={`Are you sure you want to delete withdrawal "${withdrawalToDelete?.withdrawalCode}"? This action cannot be undone.`}
                onConfirm={handleDeleteConfirm}
                variant="destructive"
            />
        </>
    );
};

export default PPEWithdrawPage;

