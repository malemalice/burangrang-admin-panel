import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, Shield, MoreHorizontal } from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { PaginationParams } from '@/core/lib/types';
import { useSafetyEquipmentTypes } from '../hooks/useSafetyEquipmentTypes';
import { SafetyEquipmentType } from '../types/ppe-master-data.types';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import { PermissionGuard } from '@/core/components/ui/PermissionGuard';
import { usePermissions } from '@/core/hooks/usePermissions';

export default function SafetyEquipmentTypesPage() {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const {
        types,
        totalTypes,
        currentPage,
        isLoading,
        fetchTypes,
        deleteType,
    } = useSafetyEquipmentTypes();
    const [pageIndex, setPageIndex] = useState(0);
    const [limit, setLimit] = useState(10);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [typeToDelete, setTypeToDelete] = useState<SafetyEquipmentType | null>(null);
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
    const [sorting, setSorting] = useState<{ id: string; desc: boolean } | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    const filterFields: FilterField[] = useMemo(() => [
        {
            id: 'name',
            label: 'Type Name',
            type: 'text',
        },
        {
            id: 'code',
            label: 'Type Code',
            type: 'text',
        },
        {
            id: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
            ],
        },
    ], []);

    const fetchData = useCallback(async () => {
        const params: PaginationParams = {
            page: pageIndex + 1,
            limit,
            search: searchTerm,
            sortBy: sorting ? (sorting.id === 'status' ? 'isActive' : sorting.id) : 'updatedAt',
            sortOrder: sorting ? (sorting.desc ? 'desc' : 'asc') : 'desc',
            filters: {
                // Exclude status filter, only include other filters
                ...Object.entries(activeFilters)
                    .filter(([key]) => key !== 'status')
                    .reduce((acc, [key, item]) => ({
                        ...acc,
                        [key]: item.value
                    }), {}),
                // Explicitly set isActive based on status filter
                isActive: activeFilters.status?.value === 'active' ? true :
                    activeFilters.status?.value === 'inactive' ? false :
                        undefined
            }
        };
        await fetchTypes(params);
    }, [pageIndex, limit, searchTerm, activeFilters, sorting, fetchTypes]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDeleteClick = useCallback((type: SafetyEquipmentType, event?: React.MouseEvent) => {
        event?.stopPropagation();
        setOpenDropdownId(null); // Explicitly close the dropdown
        setTypeToDelete(type);
        setDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!typeToDelete) return;
        try {
            await deleteType(typeToDelete.id);
            setOpenDropdownId(null); // Ensure dropdown is closed
            fetchData();
        } catch (error) {
            // Error already handled in hook with toast notification
        } finally {
            setDeleteDialogOpen(false);
            setTypeToDelete(null);
        }
    }, [typeToDelete, deleteType, fetchData]);

    const handleDialogCancel = useCallback(() => {
        setDeleteDialogOpen(false);
        setTypeToDelete(null);
        setOpenDropdownId(null); // Ensure dropdown is closed
    }, []);

    const handleSearch = useCallback((term: string) => {
        setSearchTerm(term);
        setPageIndex(0);
    }, []);

    const handleApplyFilters = useCallback((filters: any[]) => {
        const newActiveFilters: Record<string, { value: any; label: string }> = {};
        filters.forEach((filter: any) => {
            if (filter.id === 'status') {
                newActiveFilters[filter.id] = {
                    value: filter.value,
                    label: filter.value === 'active' ? 'Active' : 'Inactive'
                };
            } else {
                newActiveFilters[filter.id] = {
                    value: filter.value,
                    label: String(filter.value)
                };
            }
        });
        setActiveFilters(newActiveFilters);
        setPageIndex(0);
    }, []);

    const handleSortingChange = useCallback((newSorting: { id: string; desc: boolean } | null) => {
        setSorting(newSorting);
        setPageIndex(0);
    }, []);

    const handleTabChange = useCallback((value: string) => {
        setActiveTab(value);
        setPageIndex(0);
        if (value === 'all') {
            setActiveFilters({});
        } else if (value === 'active') {
            setActiveFilters({ status: { value: 'active', label: 'Active' } });
        } else if (value === 'inactive') {
            setActiveFilters({ status: { value: 'inactive', label: 'Inactive' } });
        }
    }, []);

    const columns = useMemo(() => [
        {
            id: 'name',
            header: 'Type Name',
            isSortable: true,
            cell: (type: SafetyEquipmentType) => (
                <div>
                    <div className="font-medium">{type.name}</div>
                    <div className="text-xs text-gray-500 mt-1">Code: {type.code}</div>
                </div>
            ),
        },
        {
            id: 'description',
            header: 'Description',
            isSortable: true,
            cell: (type: SafetyEquipmentType) => type.description || '-',
        },
        {
            id: 'status',
            header: 'Status',
            isSortable: true,
            cell: (type: SafetyEquipmentType) => (
                <Badge
                    variant="outline"
                    className={`${type.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                        } border-0`}
                >
                    {type.isActive ? 'Active' : 'Inactive'}
                </Badge>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: (type: SafetyEquipmentType) => (
                <DropdownMenu
                    open={openDropdownId === type.id}
                    onOpenChange={(open) => {
                        setOpenDropdownId(open ? type.id : null);
                    }}
                >
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/master/safety-equipment-types/${type.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={(e) => handleDeleteClick(type, e)}
                            className="text-red-600 focus:text-red-600"
                        >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ], [openDropdownId, navigate, handleDeleteClick, hasPermission]);

    return (
        <>
            <PageHeader
                title="Safety Equipment Types"
                subtitle="Manage safety equipment types"
                actions={
                    <PermissionGuard permission="safety-equipment-type:create">
                        <Button onClick={() => navigate('/master/safety-equipment-types/new')}>
                            <Plus className="mr-2 h-4 w-4" /> Add Type
                        </Button>
                    </PermissionGuard>
                }
            >
                <Tabs defaultValue="all" className="w-full" onValueChange={handleTabChange}>
                    <TabsList>
                        <TabsTrigger value="all">All Types</TabsTrigger>
                        <TabsTrigger value="active">Active</TabsTrigger>
                        <TabsTrigger value="inactive">Inactive</TabsTrigger>
                    </TabsList>
                </Tabs>
            </PageHeader>

            <DataTable
                columns={columns}
                data={types}
                isLoading={isLoading}
                pagination={{
                    pageIndex,
                    limit,
                    pageCount: Math.ceil(totalTypes / limit),
                    onPageChange: setPageIndex,
                    onPageSizeChange: setLimit,
                    total: totalTypes
                }}
                sorting={sorting}
                onSortingChange={handleSortingChange}
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
                title="Delete Safety Equipment Type"
                description={`Are you sure you want to delete "${typeToDelete?.name}"? This action cannot be undone.`}
                onConfirm={handleDeleteConfirm}
                variant="destructive"
            />
        </>
    );
}

