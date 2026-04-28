import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Edit, Trash2, Plus, MoreHorizontal } from 'lucide-react';
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

const FILTER_PARAM_KEYS = ['name', 'code', 'status'] as const;

export default function SafetyEquipmentTypesPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { hasPermission } = usePermissions();
    const {
        types,
        totalTypes,
        isLoading,
        fetchTypes,
        deleteType,
    } = useSafetyEquipmentTypes();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [typeToDelete, setTypeToDelete] = useState<SafetyEquipmentType | null>(null);
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
        const status = searchParams.get('status');
        if (status === 'active' || status === 'inactive') {
            out.status = { value: status, label: status === 'active' ? 'Active' : 'Inactive' };
        }
        const name = searchParams.get('name');
        if (name) out.name = { value: name, label: name };
        const code = searchParams.get('code');
        if (code) out.code = { value: code, label: code };
        return out;
    }, [searchParams]);

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

    const fetchData = useCallback(async () => {
        const trimmed = searchTerm.trim();
        const params: PaginationParams = {
            page: pageIndex + 1,
            limit,
            search: trimmed.length > 0 ? trimmed : undefined,
            sortBy: sorting ? (sorting.id === 'status' ? 'isActive' : sorting.id) : 'updatedAt',
            sortOrder: sorting ? (sorting.desc ? 'desc' : 'asc') : 'desc',
            filters: {
                ...Object.entries(activeFilters)
                    .filter(([key]) => key !== 'status')
                    .reduce((acc, [key, item]) => ({
                        ...acc,
                        [key]: item.value,
                    }), {}),
                isActive:
                    activeFilters.status?.value === 'active'
                        ? true
                        : activeFilters.status?.value === 'inactive'
                          ? false
                          : undefined,
            },
        };
        await fetchTypes(params);
    }, [pageIndex, limit, searchTerm, activeFilters, sorting, fetchTypes]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDeleteClick = useCallback((type: SafetyEquipmentType, event?: React.MouseEvent) => {
        event?.stopPropagation();
        setOpenDropdownId(null);
        setTypeToDelete(type);
        setDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!typeToDelete) return;
        try {
            await deleteType(typeToDelete.id);
            setOpenDropdownId(null);
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
        setOpenDropdownId(null);
    }, []);

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
        (filters: FilterValue[]) => {
            updateSearchParams((next) => {
                FILTER_PARAM_KEYS.forEach((k) => next.delete(k));
                filters.forEach((filter: FilterValue) => {
                    if (filter.id === 'status') {
                        next.set('status', String(filter.value));
                    } else if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
                        next.set(filter.id, String(filter.value));
                    }
                });
                next.set('page', '1');
            });
        },
        [updateSearchParams]
    );

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

    const handleTabChange = useCallback(
        (value: string) => {
            updateSearchParams((next) => {
                FILTER_PARAM_KEYS.forEach((k) => next.delete(k));
                if (value === 'active') next.set('status', 'active');
                else if (value === 'inactive') next.set('status', 'inactive');
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

    const tabValue =
        activeFilters.status?.value === 'active'
            ? 'active'
            : activeFilters.status?.value === 'inactive'
              ? 'inactive'
              : 'all';

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
    ], [openDropdownId, navigate, handleDeleteClick]);

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
                <Tabs value={tabValue} className="w-full" onValueChange={handleTabChange}>
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
                    onPageChange: handlePageChange,
                    onPageSizeChange: handlePageSizeChange,
                    total: totalTypes,
                }}
                sorting={sorting}
                onSortingChange={handleSortingChange}
                filterFields={filterFields}
                onSearch={handleSearch}
                onApplyFilters={handleApplyFilters}
                activeFilters={activeFilters}
                searchValue={searchTerm}
                searchPlaceholder="Search by name, code, or description"
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
