import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { PPEStock, PPEStockSearchParams } from '../types/ppe.types';
import { FilterField } from '@/core/components/ui/filter-drawer';

const PPEStockInPage = () => {
    const navigate = useNavigate();
    const { stocks, totalStocks, isLoading, fetchStocks, deleteStock } = usePPEStocks();
    const [pageIndex, setPageIndex] = useState(0);
    const [limit, setLimit] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [stockToDelete, setStockToDelete] = useState<PPEStock | null>(null);
    const [dropdownOpenStates, setDropdownOpenStates] = useState<Record<string, boolean>>({});

    const filterFields: FilterField[] = [
        {
            id: 'stockCode',
            label: 'Stock Code',
            type: 'text',
        },
        {
            id: 'isActive',
            label: 'Status',
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
    ];

    const loadStocks = useCallback(() => {
        const params: PPEStockSearchParams = {
            page: pageIndex + 1,
            limit,
            sortBy: 'receivedDate',
            sortOrder: 'desc',
            search: searchTerm,
            isActive: activeFilters.isActive?.value === 'true' ? true : activeFilters.isActive?.value === 'false' ? false : undefined,
            receivedDateFrom: activeFilters.receivedDateFrom?.value,
            receivedDateTo: activeFilters.receivedDateTo?.value,
        };
        fetchStocks(params);
    }, [pageIndex, limit, searchTerm, activeFilters, fetchStocks]);

    useEffect(() => {
        loadStocks();
    }, [loadStocks]);

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        setPageIndex(0);
    };

    const handleApplyFilters = (filterValues: any[]) => {
        const newFilters: Record<string, { value: any; label: string }> = {};
        filterValues.forEach((filter) => {
            newFilters[filter.id] = { value: filter.value, label: filter.label || filter.id };
        });
        setActiveFilters(newFilters);
        setPageIndex(0);
    };

    const handleDeleteClick = (stock: PPEStock) => {
        // Close all dropdowns before opening delete dialog
        setDropdownOpenStates({});
        setStockToDelete(stock);
        // Use setTimeout to ensure dropdown is fully closed before opening dialog
        setTimeout(() => {
            setDeleteDialogOpen(true);
        }, 0);
    };

    const handleDeleteConfirm = async () => {
        if (!stockToDelete) return;
        try {
            await deleteStock(stockToDelete.id);
            // Close all dropdowns and clear state after successful delete
            setDropdownOpenStates({});
            loadStocks();
        } catch (error) {
            // Error already handled in hook with toast notification
        } finally {
            setDeleteDialogOpen(false);
            setStockToDelete(null);
        }
    };

    const columns = [
        {
            id: 'stockCode',
            header: 'Stock Code',
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
            id: 'status',
            header: 'Status',
            cell: (stock: PPEStock) => (
                <Badge variant="outline" className={stock.isActive ? 'bg-green-100 text-green-800 border-0' : 'bg-gray-100 text-gray-800 border-0'}>
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
                    open={dropdownOpenStates[stock.id]}
                    onOpenChange={(open) => setDropdownOpenStates(prev => ({ ...prev, [stock.id]: open }))}
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
                            onClick={() => handleDeleteClick(stock)}
                            className="text-red-600 focus:text-red-600"
                        >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
            isSortable: false,
        },
    ];

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
                    onPageChange: setPageIndex,
                    onPageSizeChange: setLimit,
                    total: totalStocks,
                }}
                filterFields={filterFields}
                onSearch={handleSearch}
                onApplyFilters={handleApplyFilters}
            />

            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete PPE Stock"
                description={`Are you sure you want to delete stock "${stockToDelete?.stockCode}"? This action cannot be undone.`}
                onConfirm={handleDeleteConfirm}
            />
        </>
    );
};

export default PPEStockInPage;

