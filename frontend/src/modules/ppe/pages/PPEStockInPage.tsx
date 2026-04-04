import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Eye, Edit, Package, Calendar, Trash2, MoreHorizontal } from 'lucide-react';
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
import { usePPEStocks } from '../hooks/usePPE';
import { PPEStock, PPEStockSearchParams, PPEStockStatus } from '../types/ppe.types';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';

const FILTER_PARAM_KEYS = ['stockCode', 'isActive', 'receivedDateFrom', 'receivedDateTo'] as const;

const PPEStockInPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { stocks, totalStocks, isLoading, fetchStocks, deleteStock } = usePPEStocks();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [stockToDelete, setStockToDelete] = useState<PPEStock | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    const filterFields: FilterField[] = useMemo(() => [
        {
            id: 'stockCode',
            label: 'PO/PR Code',
            type: 'text',
        },
        {
            id: 'isActive',
            label: 'Active Status',
            type: 'select',
            options: [
                { label: 'Active', value: 'true' },
                { label: 'Inactive', value: 'false' },
            ],
        },
        {
            id: 'receivedDateFrom',
            label: 'Received Date From',
            type: 'date',
        },
        {
            id: 'receivedDateTo',
            label: 'Received Date To',
            type: 'date',
        },
    ], []);

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
        const stockCode = searchParams.get('stockCode');
        if (stockCode) out.stockCode = { value: stockCode, label: stockCode };
        const isActive = searchParams.get('isActive');
        if (isActive === 'true' || isActive === 'false') {
            const field = filterFields.find((f) => f.id === 'isActive');
            const opt = field?.options?.find((o) => o.value === isActive);
            out.isActive = { value: isActive, label: opt?.label ?? isActive };
        }
        const receivedDateFrom = searchParams.get('receivedDateFrom');
        if (receivedDateFrom) {
            out.receivedDateFrom = { value: receivedDateFrom, label: 'Received Date From' };
        }
        const receivedDateTo = searchParams.get('receivedDateTo');
        if (receivedDateTo) {
            out.receivedDateTo = { value: receivedDateTo, label: 'Received Date To' };
        }
        return out;
    }, [searchParams, filterFields]);

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

    const loadStocks = useCallback(() => {
        const searchValue =
            (typeof activeFilters.stockCode?.value === 'string' ? activeFilters.stockCode.value : '') || searchTerm;

        let receivedDateFrom: string | undefined;
        let receivedDateTo: string | undefined;

        if (activeFilters.receivedDateFrom?.value) {
            const dateFrom = new Date(activeFilters.receivedDateFrom.value as string);
            if (!isNaN(dateFrom.getTime())) {
                receivedDateFrom = dateFrom.toISOString().split('T')[0];
            }
        }

        if (activeFilters.receivedDateTo?.value) {
            const dateTo = new Date(activeFilters.receivedDateTo.value as string);
            if (!isNaN(dateTo.getTime())) {
                receivedDateTo = dateTo.toISOString().split('T')[0];
            }
        }

        const params: PPEStockSearchParams = {
            page: pageIndex + 1,
            limit,
            sortBy: sorting?.id === 'stockStatus' ? 'isActive' : sorting?.id || 'updatedAt',
            sortOrder: sorting ? (sorting.desc ? 'desc' : 'asc') : 'desc',
            search: searchValue.trim() || undefined,
            isActive:
                activeFilters.isActive?.value === 'true'
                    ? true
                    : activeFilters.isActive?.value === 'false'
                      ? false
                      : undefined,
            receivedDateFrom,
            receivedDateTo,
        };
        fetchStocks(params);
    }, [pageIndex, limit, searchTerm, activeFilters, sorting, fetchStocks]);

    useEffect(() => {
        loadStocks();
    }, [loadStocks]);

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
                    if (filter.id === 'receivedDateFrom' || filter.id === 'receivedDateTo') {
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

    const handleDeleteClick = useCallback((stock: PPEStock, event?: React.MouseEvent) => {
        event?.stopPropagation();
        setOpenDropdownId(null);
        setStockToDelete(stock);
        setDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!stockToDelete) return;
        try {
            await deleteStock(stockToDelete.id);
            setOpenDropdownId(null);
            loadStocks();
        } catch (error) {
            // Error already handled in hook with toast notification
        } finally {
            setDeleteDialogOpen(false);
            setStockToDelete(null);
        }
    }, [stockToDelete, deleteStock, loadStocks]);

    const handleDialogCancel = useCallback(() => {
        setDeleteDialogOpen(false);
        setStockToDelete(null);
        setOpenDropdownId(null);
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

    const getAggregateStatus = useCallback((stock: PPEStock): { label: string; className: string } => {
        if (!stock.items || stock.items.length === 0) {
            return { label: 'No Items', className: 'bg-gray-100 text-gray-800 border-0' };
        }

        const statusCounts: Record<string, number> = {};
        stock.items.forEach((item) => {
            const status = item.status || PPEStockStatus.AVAILABLE;
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        const totalItems = stock.items.length;
        const availableCount = statusCounts[PPEStockStatus.AVAILABLE] || 0;
        const reservedCount = statusCounts[PPEStockStatus.RESERVED] || 0;
        const issuedCount = statusCounts[PPEStockStatus.ISSUED] || 0;
        const expiredCount = statusCounts[PPEStockStatus.EXPIRED] || 0;
        const disposedCount = statusCounts[PPEStockStatus.DISPOSED] || 0;

        if (expiredCount > 0) {
            return { label: 'Has Expired Items', className: 'bg-red-100 text-red-800 border-0' };
        }
        if (disposedCount === totalItems) {
            return { label: 'Disposed', className: 'bg-gray-100 text-gray-800 border-0' };
        }
        if (issuedCount === totalItems) {
            return { label: 'Issued', className: 'bg-blue-100 text-blue-800 border-0' };
        }
        if (reservedCount > 0) {
            return { label: 'Partially Reserved', className: 'bg-yellow-100 text-yellow-800 border-0' };
        }
        if (availableCount === totalItems) {
            return { label: 'Available', className: 'bg-green-100 text-green-800 border-0' };
        }

        return { label: 'Mixed Status', className: 'bg-orange-100 text-orange-800 border-0' };
    }, []);

    const columns = useMemo(() => [
        {
            id: 'stockCode',
            header: 'PO/PR Code',
            cell: (stock: PPEStock) => (
                <div className="font-medium">{stock.stockCode}</div>
            ),
            isSortable: true,
        },
        {
            id: 'receivedDate',
            header: 'Received Date',
            cell: (stock: PPEStock) => (
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(stock.receivedDate).toLocaleDateString()}</span>
                </div>
            ),
            isSortable: true,
        },
        {
            id: 'items',
            header: 'Items',
            cell: (stock: PPEStock) => (
                <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>{stock.items?.length || 0} items</span>
                </div>
            ),
            isSortable: false,
        },
        {
            id: 'stockStatus',
            header: 'Active Status',
            cell: (stock: PPEStock) => (
                <Badge
                    variant="outline"
                    className={stock.isActive
                        ? 'bg-green-100 text-green-800 border-0'
                        : 'bg-gray-100 text-gray-800 border-0'
                    }
                >
                    {stock.isActive ? 'Active' : 'Inactive'}
                </Badge>
            ),
            isSortable: true,
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: (stock: PPEStock) => (
                <DropdownMenu
                    open={openDropdownId === stock.id}
                    onOpenChange={(open) => {
                        setOpenDropdownId(open ? stock.id : null);
                    }}
                >
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/ppe/stocks/${stock.id}`)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/ppe/stocks/${stock.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={(e) => handleDeleteClick(stock, e)}
                            className="text-red-600 focus:text-red-600"
                        >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
            isSortable: false,
        },
    ], [openDropdownId, navigate, handleDeleteClick, getAggregateStatus]);

    return (
        <>
            <PageHeader
                title="PPE Stock In"
                subtitle="Manage PPE stock entries"
                actions={
                    <Button onClick={() => navigate('/ppe/stocks/new')}>
                        <Plus className="mr-2 h-4 w-4" /> Add Stock
                    </Button>
                }
            />

            <DataTable
                columns={columns}
                data={stocks}
                isLoading={isLoading}
                pagination={{
                    pageIndex,
                    limit,
                    pageCount: Math.ceil(totalStocks / limit),
                    onPageChange: handlePageChange,
                    onPageSizeChange: handlePageSizeChange,
                    total: totalStocks,
                }}
                sorting={sorting}
                onSortingChange={handleSortingChange}
                filterFields={filterFields}
                onSearch={handleSearch}
                onApplyFilters={handleApplyFilters}
                activeFilters={activeFilters}
                searchValue={searchTerm}
                searchPlaceholder="Search by PO/PR code"
            />

            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        handleDialogCancel();
                    }
                }}
                title="Delete PPE Stock"
                description={`Are you sure you want to delete stock "${stockToDelete?.stockCode}"? This action cannot be undone.`}
                onConfirm={handleDeleteConfirm}
                variant="destructive"
            />
        </>
    );
};

export default PPEStockInPage;
