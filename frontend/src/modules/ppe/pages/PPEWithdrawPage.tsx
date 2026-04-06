import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePDF } from 'react-to-pdf';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Plus, Eye, Package, Trash2, Info, ArrowRight, FileText, CheckCircle2, FileDown, Printer } from 'lucide-react';
import { PPEWithdrawalListPDFTemplate } from '../components/PPEWithdrawalListPDFTemplate';
import { PPEWithdrawalPDFTemplate } from '../components/PPEWithdrawalPDFTemplate';
import ppeService from '../services/ppeService';
import approvalService from '@/modules/master-data/services/approvalService';
import type { ApprovalStatusHistory } from '@/modules/master-data';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import DataTable from '@/core/components/ui/data-table/DataTable';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/core/components/ui/tooltip';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/core/components/ui/dialog';
import { usePPEWithdrawals } from '../hooks/usePPE';
import { PPEWithdrawal, PPEWithdrawalSearchParams, PPEWithdrawalStatus } from '../types/ppe.types';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import { departmentService, masterApprovalService, type Department } from '@/modules/master-data';
import { APPROVAL_ENTITIES } from '@/modules/master-data/constants/approval-entities';
import { MasterApprovalItem, PaginationParams } from '@/core/lib/types';

const FILTER_PARAM_KEYS = ['withdrawalCode', 'status', 'departmentId', 'withdrawalDateFrom', 'withdrawalDateTo'] as const;

const emptyApprovalHistory: ApprovalStatusHistory = {
    history: [],
    nextApprover: null,
    allApprovalLines: [],
    currentStatus: 'UNKNOWN',
};

const PPEWithdrawPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { withdrawals, totalWithdrawals, isLoading, fetchWithdrawals, deleteWithdrawal } = usePPEWithdrawals();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [withdrawalToDelete, setWithdrawalToDelete] = useState<PPEWithdrawal | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isWorkflowInfoDialogOpen, setIsWorkflowInfoDialogOpen] = useState(false);
    const [ppeWithdrawalApprovalLines, setPpeWithdrawalApprovalLines] = useState<MasterApprovalItem[] | null>(null);
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [printingRowId, setPrintingRowId] = useState<string | null>(null);
    const [rowPdfPayload, setRowPdfPayload] = useState<{
        withdrawal: PPEWithdrawal;
        approval: ApprovalStatusHistory | null;
    } | null>(null);

    const { toPDF, targetRef } = usePDF({
        filename: `ppe-withdrawals-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`,
    });

    const handleExportPDF = async () => {
        try {
            setIsExportingPDF(true);
            setRowPdfPayload(null);
            await new Promise((resolve) => setTimeout(resolve, 200));
            await toPDF({
                filename: `ppe-withdrawals-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`,
            });
            toast.success('PDF exported successfully');
        } catch (error) {
            console.error('Failed to export PDF:', error);
            toast.error('Failed to export PDF');
        } finally {
            setIsExportingPDF(false);
        }
    };

    const handlePrintRowPDF = useCallback(async (withdrawal: PPEWithdrawal) => {
        setPrintingRowId(withdrawal.id);
        try {
            const [full, status] = await Promise.all([
                ppeService.getWithdrawalById(withdrawal.id),
                approvalService.checkApprovalStatus(withdrawal.id, APPROVAL_ENTITIES.PPE_WITHDRAWAL),
            ]);
            const approval =
                status && !(status as unknown as { error?: boolean }).error
                    ? status
                    : emptyApprovalHistory;
            setRowPdfPayload({ withdrawal: full, approval });
            await new Promise((resolve) => setTimeout(resolve, 200));
            await toPDF({
                filename: `ppe-withdrawal-${full.withdrawalCode}-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`,
            });
            toast.success('PDF exported successfully');
        } catch (error) {
            console.error('Failed to export withdrawal PDF:', error);
            toast.error('Failed to export PDF');
        } finally {
            setRowPdfPayload(null);
            setPrintingRowId(null);
        }
    }, [toPDF]);

    // Fetch Master Approval lines for PPE_WITHDRAWAL when workflow dialog opens (for dynamic workflow guideline)
    useEffect(() => {
        if (!isWorkflowInfoDialogOpen) return;
        let cancelled = false;
        const fetchPpeWithdrawalApprovalLines = async () => {
            setPpeWithdrawalApprovalLines(null);
            try {
                const response = await masterApprovalService.getAll({
                    page: 1,
                    limit: 10,
                    search: APPROVAL_ENTITIES.PPE_WITHDRAWAL,
                    isActive: true,
                    options: true,
                } as PaginationParams);
                if (cancelled) return;
                const list = Array.isArray(response?.data) ? response.data : [];
                const approval = list.find((a: { entity: string }) => a.entity === APPROVAL_ENTITIES.PPE_WITHDRAWAL);
                setPpeWithdrawalApprovalLines(approval?.items ?? []);
            } catch {
                if (!cancelled) setPpeWithdrawalApprovalLines([]);
            }
        };
        fetchPpeWithdrawalApprovalLines();
        return () => { cancelled = true; };
    }, [isWorkflowInfoDialogOpen]);

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
            type: 'searchableSelect',
            options: [
                { label: 'Pending', value: 'PENDING' },
                { label: 'Waiting Approval', value: 'WAITING_APPROVAL' },
                { label: 'Approved', value: 'APPROVED' },
                { label: 'Collected', value: 'COLLECTED' },
                { label: 'Cancelled', value: 'CANCELLED' },
                { label: 'Rejected', value: 'REJECTED' },
            ],
        },
        {
            id: 'departmentId',
            label: 'Department',
            type: 'searchableSelect',
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
    ], [departments]);

    const pageIndex = useMemo(() => {
        const raw = searchParams.get('page');
        const page = raw ? Number(raw) : 1;
        if (!Number.isFinite(page) || page <= 0) return 0;
        return Math.floor(page) - 1;
    }, [searchParams]);

    const limit = useMemo(() => {
        const raw = searchParams.get('limit');
        const parsed = raw ? Number(raw) : 10;
        if (!Number.isFinite(parsed) || parsed <= 0) return 10;
        return Math.floor(parsed);
    }, [searchParams]);

    const searchTerm = useMemo(() => searchParams.get('search') ?? '', [searchParams]);

    const activeFilters = useMemo(() => {
        const out: Record<string, { value: unknown; label: string }> = {};
        const withdrawalCode = searchParams.get('withdrawalCode');
        if (withdrawalCode) out.withdrawalCode = { value: withdrawalCode, label: withdrawalCode };
        const status = searchParams.get('status');
        if (status) {
            const field = filterFields.find((f) => f.id === 'status');
            const opt = field?.options?.find((o) => o.value === status);
            out.status = { value: status, label: opt?.label ?? status };
        }
        const departmentId = searchParams.get('departmentId');
        if (departmentId) {
            const dept = departments.find((d) => d.id === departmentId);
            out.departmentId = { value: departmentId, label: dept?.name ?? departmentId };
        }
        const withdrawalDateFrom = searchParams.get('withdrawalDateFrom');
        if (withdrawalDateFrom) {
            out.withdrawalDateFrom = { value: withdrawalDateFrom, label: 'Withdrawal Date From' };
        }
        const withdrawalDateTo = searchParams.get('withdrawalDateTo');
        if (withdrawalDateTo) {
            out.withdrawalDateTo = { value: withdrawalDateTo, label: 'Withdrawal Date To' };
        }
        return out;
    }, [searchParams, filterFields, departments]);

    const sorting = useMemo((): { id: string; desc: boolean } | null => {
        const sortBy = searchParams.get('sortBy');
        const sortOrder = searchParams.get('sortOrder');
        if (!sortBy) return null;
        return { id: sortBy, desc: sortOrder !== 'asc' };
    }, [searchParams]);

    const updateSearchParams = useCallback(
        (updater: (next: URLSearchParams) => void, options: { replace?: boolean } = { replace: true }) => {
            const next = new URLSearchParams(searchParams);
            updater(next);
            setSearchParams(next, options);
        },
        [searchParams, setSearchParams]
    );

    const loadWithdrawals = useCallback(() => {
        const codeFilter =
            typeof activeFilters.withdrawalCode?.value === 'string'
                ? activeFilters.withdrawalCode.value.trim()
                : '';
        const toolbar = searchTerm.trim();
        const searchForApi = codeFilter || toolbar || undefined;

        const params: PPEWithdrawalSearchParams = {
            page: pageIndex + 1,
            limit,
            sortBy: sorting?.id || 'updatedAt',
            sortOrder: sorting ? (sorting.desc ? 'desc' : 'asc') : 'desc',
            search: searchForApi,
            status: activeFilters.status?.value as PPEWithdrawalStatus | undefined,
            departmentId: activeFilters.departmentId?.value as string | undefined,
            withdrawalDateFrom: activeFilters.withdrawalDateFrom?.value as string | undefined,
            withdrawalDateTo: activeFilters.withdrawalDateTo?.value as string | undefined,
        };
        fetchWithdrawals(params);
    }, [pageIndex, limit, searchTerm, activeFilters, sorting, fetchWithdrawals]);

    useEffect(() => {
        loadWithdrawals();
    }, [loadWithdrawals]);

    const handleSearch = useCallback(
        (term: string) => {
            const trimmed = term.trim();
            updateSearchParams((next) => {
                if (trimmed) next.set('search', trimmed);
                else next.delete('search');
                next.set('page', '1');
            });
        },
        [updateSearchParams]
    );

    const handleApplyFilters = useCallback(
        (filterValues: FilterValue[]) => {
            updateSearchParams((next) => {
                FILTER_PARAM_KEYS.forEach((k) => next.delete(k));
                filterValues.forEach((filter) => {
                    if (filter.value === undefined || filter.value === null || filter.value === '') return;
                    if (filter.id === 'withdrawalDateFrom' || filter.id === 'withdrawalDateTo') {
                        if (typeof filter.value === 'string') {
                            const date = new Date(filter.value);
                            if (!isNaN(date.getTime())) {
                                next.set(filter.id, date.toISOString().split('T')[0]);
                            }
                        }
                    } else {
                        next.set(filter.id, String(filter.value));
                    }
                });
                next.set('page', '1');
            });
        },
        [updateSearchParams]
    );

    const handleDeleteClick = useCallback((withdrawal: PPEWithdrawal, event?: React.MouseEvent) => {
        // Only allow delete for PENDING or CANCELLED status
        if (withdrawal.status !== PPEWithdrawalStatus.PENDING && withdrawal.status !== PPEWithdrawalStatus.CANCELLED) {
            return;
        }
        event?.stopPropagation();
        setWithdrawalToDelete(withdrawal);
        setDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!withdrawalToDelete) return;
        try {
            await deleteWithdrawal(withdrawalToDelete.id);
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
    }, []);

    const handleSortingChange = useCallback(
        (newSorting: { id: string; desc: boolean } | null) => {
            updateSearchParams((next) => {
                if (newSorting) {
                    next.set('sortBy', newSorting.id);
                    next.set('sortOrder', newSorting.desc ? 'desc' : 'asc');
                } else {
                    next.delete('sortBy');
                    next.delete('sortOrder');
                }
                next.set('page', '1');
            });
        },
        [updateSearchParams]
    );

    const handlePageChange = (page: number) => {
        updateSearchParams((next) => {
            next.set('page', String(page + 1));
        });
    };

    const handlePageSizeChange = (size: number) => {
        updateSearchParams((next) => {
            next.set('limit', String(size));
            next.set('page', '1');
        });
    };

    const getStatusBadge = useCallback((status: PPEWithdrawalStatus) => {
        const variants: Record<PPEWithdrawalStatus, { className: string; label: string }> = {
            PENDING: { className: 'bg-yellow-100 text-yellow-800 border-0', label: 'Pending' },
            WAITING_APPROVAL: { className: 'bg-amber-100 text-amber-800 border-0', label: 'Waiting Approval' },
            APPROVED: { className: 'bg-blue-100 text-blue-800 border-0', label: 'Approved' },
            COLLECTED: { className: 'bg-green-100 text-green-800 border-0', label: 'Collected' },
            CANCELLED: { className: 'bg-red-100 text-red-800 border-0', label: 'Cancelled' },
            REJECTED: { className: 'bg-red-100 text-red-800 border-0', label: 'Rejected' },
        };
        const variant = variants[status] || { className: 'bg-gray-100 text-gray-800 border-0', label: String(status) };
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
                const isPrintingThisRow = printingRowId === withdrawal.id;
                return (
                    <div className="flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigate(`/ppe/withdrawals/${withdrawal.id}`)}
                                    title="View Details"
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Details</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handlePrintRowPDF(withdrawal)}
                                    disabled={isLoading || isExportingPDF || printingRowId !== null}
                                    title="Print PDF"
                                >
                                    <Printer className={`h-4 w-4 ${isPrintingThisRow ? 'animate-pulse' : ''}`} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Print PDF</TooltipContent>
                        </Tooltip>
                        {canDelete && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => handleDeleteClick(withdrawal, e)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Delete"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                );
            },
            isSortable: false,
        },
    ], [navigate, handleDeleteClick, getStatusBadge, handlePrintRowPDF, printingRowId, isLoading, isExportingPDF]);

    return (
        <>
            {/* Hidden PDF template: list export or single-row detail export */}
            <div
                ref={targetRef}
                style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '210mm' }}
                aria-hidden="true"
            >
                {rowPdfPayload ? (
                    <PPEWithdrawalPDFTemplate
                        withdrawal={rowPdfPayload.withdrawal}
                        approvalHistory={rowPdfPayload.approval}
                        viewUrl={`${window.location.origin}/ppe/withdrawals/${rowPdfPayload.withdrawal.id}`}
                    />
                ) : (
                    <PPEWithdrawalListPDFTemplate withdrawals={withdrawals} />
                )}
            </div>
            <PageHeader
                title="PPE Withdrawals"
                subtitle="Manage PPE withdrawal requests"
                actions={
                    <div className="flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setIsWorkflowInfoDialogOpen(true)}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <Info className="h-4 w-4" />
                                    <span className="sr-only">View workflow information</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>View PPE Withdrawal Workflow</p>
                            </TooltipContent>
                        </Tooltip>
                        <Button
                            variant="outline"
                            onClick={handleExportPDF}
                            disabled={isLoading || isExportingPDF}
                        >
                            <FileDown className="mr-2 h-4 w-4" />
                            {isExportingPDF ? 'Exporting...' : 'Export PDF'}
                        </Button>
                        <Button onClick={() => navigate('/ppe/withdrawals/new')}>
                            <Plus className="mr-2 h-4 w-4" /> New Withdrawal
                        </Button>
                    </div>
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
                    onPageChange: handlePageChange,
                    onPageSizeChange: handlePageSizeChange,
                    total: totalWithdrawals,
                }}
                sorting={sorting}
                onSortingChange={handleSortingChange}
                filterFields={filterFields}
                onSearch={handleSearch}
                onApplyFilters={handleApplyFilters}
                activeFilters={activeFilters}
                searchValue={searchTerm}
                searchPlaceholder="Search by withdrawal code"
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

            {/* Workflow Information Dialog — PPE withdrawal workflow per TRD workflow guideline */}
            <Dialog open={isWorkflowInfoDialogOpen} onOpenChange={setIsWorkflowInfoDialogOpen}>
                <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
                    <DialogHeader className="px-6 pt-6 pb-4">
                        <DialogTitle>PPE Withdrawal Workflow</DialogTitle>
                        <DialogDescription>
                            Withdrawal requests move from creation to approval by the configured approver(s), then to collection.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="px-6 pb-6">
                        <div className="flex flex-col md:flex-row md:items-stretch gap-4 md:gap-2">
                            {/* Step 1: Requester */}
                            <div className="flex flex-1 flex-col min-w-0 rounded-lg border border-blue-200/80 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-800/50 overflow-hidden">
                                <div className="flex items-center gap-3 px-4 py-3 border-b border-blue-200/60 dark:border-blue-800/40">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Step 1</span>
                                        <h3 className="font-semibold text-foreground leading-tight">Requester</h3>
                                    </div>
                                </div>
                                <dl className="grid gap-2 px-4 py-3 text-sm">
                                    <div>
                                        <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Status</dt>
                                        <dd className="mt-0.5 font-medium text-foreground">Pending</dd>
                                    </div>
                                    <div>
                                        <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Responsible</dt>
                                        <dd className="mt-0.5 font-medium text-foreground">Withdrawal creator</dd>
                                    </div>
                                    <div>
                                        <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Role / Dept</dt>
                                        <dd className="mt-0.5 text-muted-foreground">User who created the request (any department); editable until submitted for approval</dd>
                                    </div>
                                </dl>
                                <p className="px-4 pb-3 text-xs text-muted-foreground border-t border-blue-200/40 dark:border-blue-800/30 pt-2">
                                    Creates the withdrawal with items and requested for; can edit until submitted for approval.
                                </p>
                            </div>

                            <div className="hidden md:flex shrink-0 items-center justify-center w-6 self-center">
                                <ArrowRight className="h-5 w-5 text-muted-foreground/60" aria-hidden />
                            </div>

                            {/* Step 2: Approver(s) — dynamic from Master Approval */}
                            {ppeWithdrawalApprovalLines === null ? (
                                <>
                                    <div className="flex flex-1 flex-col min-w-0 rounded-lg border border-green-200/80 bg-green-50/40 dark:bg-green-950/20 dark:border-green-800/50 overflow-hidden">
                                        <div className="flex items-center gap-3 px-4 py-3 border-b border-green-200/60 dark:border-green-800/40">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                                                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <span className="text-xs font-medium text-green-600 dark:text-green-400">Step 2</span>
                                                <h3 className="font-semibold text-foreground leading-tight">Approver</h3>
                                            </div>
                                        </div>
                                        <div className="px-4 py-4 text-sm text-muted-foreground">
                                            Loading approval steps...
                                        </div>
                                    </div>
                                </>
                            ) : ppeWithdrawalApprovalLines.length > 0 ? (
                                ppeWithdrawalApprovalLines.map((item, index) => (
                                    <div key={item.id} className="contents">
                                        <div className="hidden md:flex shrink-0 items-center justify-center w-6 self-center">
                                            <ArrowRight className="h-5 w-5 text-muted-foreground/60" aria-hidden />
                                        </div>
                                        <div className="flex flex-1 flex-col min-w-0 rounded-lg border border-green-200/80 bg-green-50/40 dark:bg-green-950/20 dark:border-green-800/50 overflow-hidden">
                                            <div className="flex items-center gap-3 px-4 py-3 border-b border-green-200/60 dark:border-green-800/40">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                                                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                </div>
                                                <div>
                                                    <span className="text-xs font-medium text-green-600 dark:text-green-400">Step {2 + index}</span>
                                                    <h3 className="font-semibold text-foreground leading-tight">Approver</h3>
                                                </div>
                                            </div>
                                            <dl className="grid gap-2 px-4 py-3 text-sm">
                                                <div>
                                                    <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Status</dt>
                                                    <dd className="mt-0.5 font-medium text-foreground">Waiting Approval</dd>
                                                </div>
                                                <div>
                                                    <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Responsible</dt>
                                                    <dd className="mt-0.5 font-medium text-foreground">{item.jobPosition?.name ?? `Approver (line ${index + 1})`}</dd>
                                                </div>
                                                <div>
                                                    <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Role / Dept</dt>
                                                    <dd className="mt-0.5 text-muted-foreground">
                                                        {[item.jobPosition?.name, item.department?.name].filter(Boolean).join(', ') || 'Per Master Approval'}
                                                    </dd>
                                                </div>
                                            </dl>
                                            <p className="px-4 pb-3 text-xs text-muted-foreground border-t border-green-200/40 dark:border-green-800/30 pt-2">
                                                Approves or rejects. If rejected, requester can cancel or resubmit.
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <>
                                    <div className="flex flex-1 flex-col min-w-0 rounded-lg border border-green-200/80 bg-green-50/40 dark:bg-green-950/20 dark:border-green-800/50 overflow-hidden">
                                        <div className="flex items-center gap-3 px-4 py-3 border-b border-green-200/60 dark:border-green-800/40">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                                                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <span className="text-xs font-medium text-green-600 dark:text-green-400">Step 2</span>
                                                <h3 className="font-semibold text-foreground leading-tight">Approver</h3>
                                            </div>
                                        </div>
                                        <dl className="grid gap-2 px-4 py-3 text-sm">
                                            <div>
                                                <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Status</dt>
                                                <dd className="mt-0.5 font-medium text-foreground">Waiting Approval</dd>
                                            </div>
                                            <div>
                                                <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Responsible</dt>
                                                <dd className="mt-0.5 font-medium text-foreground">Approver (per approval line)</dd>
                                            </div>
                                            <div>
                                                <dt className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Role / Dept</dt>
                                                <dd className="mt-0.5 text-muted-foreground">Per Master Approval for PPE Withdrawal</dd>
                                            </div>
                                        </dl>
                                        <p className="px-4 pb-3 text-xs text-muted-foreground border-t border-green-200/40 dark:border-green-800/30 pt-2">
                                            Approval is configured in Master Data → Master Approvals.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="mt-4 rounded-lg bg-muted/60 px-4 py-2.5 text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Approved</span> — Withdrawal can be collected (status <strong>Collected</strong>). <span className="font-medium text-foreground">Rejected</span> / <span className="font-medium text-foreground">Cancelled</span> — No further action.
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default PPEWithdrawPage;

