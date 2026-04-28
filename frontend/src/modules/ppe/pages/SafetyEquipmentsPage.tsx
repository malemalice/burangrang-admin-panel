import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Edit, Trash2, Plus, MoreHorizontal, Eye } from 'lucide-react';
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
import { useSafetyEquipments } from '../hooks/useSafetyEquipments';
import { SafetyEquipment, SafetyEquipmentCategory, SafetyEquipmentType } from '../types/ppe-master-data.types';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import { PermissionGuard } from '@/core/components/ui/PermissionGuard';
import { usePermissions } from '@/core/hooks/usePermissions';
import safetyEquipmentTypeService from '../services/safetyEquipmentTypeService';

const FILTER_PARAM_KEYS = ['name', 'code', 'category', 'safetyEquipmentTypeId', 'status'] as const;

const CATEGORY_FILTER_OPTIONS = [
    { label: 'Personal Protective Equipment', value: SafetyEquipmentCategory.PERSONAL_PROTECTIVE_EQUIPMENT },
    { label: 'Safety Equipment', value: SafetyEquipmentCategory.SAFETY_EQUIPMENT },
    { label: 'Emergency Equipment', value: SafetyEquipmentCategory.EMERGENCY_EQUIPMENT },
] as const;

export default function SafetyEquipmentsPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { hasPermission } = usePermissions();
    const {
        equipments,
        totalEquipments,
        currentPage,
        isLoading,
        fetchEquipments,
        deleteEquipment,
    } = useSafetyEquipments();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [equipmentToDelete, setEquipmentToDelete] = useState<SafetyEquipment | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [equipmentTypes, setEquipmentTypes] = useState<SafetyEquipmentType[]>([]);

    useEffect(() => {
        let cancelled = false;
        const loadTypes = async () => {
            try {
                const response = await safetyEquipmentTypeService.getSafetyEquipmentTypes({
                    page: 1,
                    limit: 1000,
                    filters: { isActive: true },
                    options: true,
                });
                if (!cancelled) setEquipmentTypes(response.data ?? []);
            } catch {
                if (!cancelled) setEquipmentTypes([]);
            }
        };
        loadTypes();
        return () => {
            cancelled = true;
        };
    }, []);

    const filterFields: FilterField[] = useMemo(() => [
        {
            id: 'name',
            label: 'Equipment Name',
            type: 'text',
        },
        {
            id: 'code',
            label: 'Equipment Code',
            type: 'text',
        },
        {
            id: 'category',
            label: 'Category',
            type: 'searchableSelect',
            options: [...CATEGORY_FILTER_OPTIONS],
        },
        {
            id: 'safetyEquipmentTypeId',
            label: 'Equipment Type',
            type: 'searchableSelect',
            options: equipmentTypes.map((t) => ({
                label: `${t.name} (${t.code})`,
                value: t.id,
            })),
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
    ], [equipmentTypes]);

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
        const category = searchParams.get('category');
        if (category) {
            const categoryOption = CATEGORY_FILTER_OPTIONS.find((opt) => opt.value === category);
            out.category = { value: category, label: categoryOption?.label || category };
        }
        const safetyEquipmentTypeId = searchParams.get('safetyEquipmentTypeId');
        if (safetyEquipmentTypeId) {
            const t = equipmentTypes.find((x) => x.id === safetyEquipmentTypeId);
            out.safetyEquipmentTypeId = {
                value: safetyEquipmentTypeId,
                label: t ? `${t.name} (${t.code})` : safetyEquipmentTypeId,
            };
        }
        return out;
    }, [searchParams, equipmentTypes]);

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
        const trimmedSearch = searchTerm.trim();
        const finalSearch = trimmedSearch.length > 0 ? trimmedSearch : undefined;

        const params: PaginationParams = {
            page: pageIndex + 1,
            limit,
            search: finalSearch,
            sortBy: sorting ? (sorting.id === 'status' ? 'isActive' : sorting.id) : 'updatedAt',
            sortOrder: sorting ? (sorting.desc ? 'desc' : 'asc') : 'desc',
            filters: {
                ...Object.entries(activeFilters).reduce((acc: Record<string, unknown>, [key, item]) => {
                    if (key === 'status') {
                        return {
                            ...acc,
                            isActive: item.value === 'active' ? 'true' : 'false',
                        };
                    }
                    acc[key] = item.value;
                    return acc;
                }, {}),
            },
        };
        await fetchEquipments(params);
    }, [pageIndex, limit, searchTerm, activeFilters, sorting, fetchEquipments]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDeleteClick = (equipment: SafetyEquipment, event?: React.MouseEvent) => {
        event?.stopPropagation();
        setOpenDropdownId(null);
        setEquipmentToDelete(equipment);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!equipmentToDelete) return;
        try {
            await deleteEquipment(equipmentToDelete.id);
            setOpenDropdownId(null);
            fetchData();
        } catch (error) {
            // Error already handled in hook with toast notification
        } finally {
            setDeleteDialogOpen(false);
            setEquipmentToDelete(null);
        }
    };

    const handleDialogCancel = () => {
        setDeleteDialogOpen(false);
        setEquipmentToDelete(null);
        setOpenDropdownId(null);
    };

    const handleSearch = (term: string) => {
        const trimmedTerm = term.trim();
        updateSearchParams((next) => {
            if (trimmedTerm) next.set('search', trimmedTerm);
            else next.delete('search');
            next.set('page', '1');
        });
    };

    const handleApplyFilters = (filters: FilterValue[]) => {
        updateSearchParams((next) => {
            FILTER_PARAM_KEYS.forEach((k) => next.delete(k));
            filters.forEach((filter: FilterValue) => {
                if (filter.id === 'status') {
                    next.set('status', String(filter.value));
                } else if (filter.id === 'category') {
                    next.set('category', String(filter.value));
                } else if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
                    next.set(filter.id, String(filter.value));
                }
            });
            next.set('page', '1');
        });
    };

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

    const handleTabChange = (value: string) => {
        updateSearchParams((next) => {
            FILTER_PARAM_KEYS.forEach((k) => next.delete(k));
            if (value === 'all') {
                // cleared above
            } else if (value === 'active') {
                next.set('status', 'active');
            } else if (value === 'inactive') {
                next.set('status', 'inactive');
            }
            next.set('page', '1');
        });
    };

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

    const getCategoryLabel = (category: SafetyEquipmentCategory) => {
        switch (category) {
            case SafetyEquipmentCategory.PERSONAL_PROTECTIVE_EQUIPMENT:
                return 'PPE';
            case SafetyEquipmentCategory.SAFETY_EQUIPMENT:
                return 'Safety';
            case SafetyEquipmentCategory.EMERGENCY_EQUIPMENT:
                return 'Emergency';
            default:
                return category;
        }
    };

    const columns = [
        {
            id: 'name',
            header: 'Equipment Name',
            isSortable: true,
            cell: (equipment: SafetyEquipment) => (
                <div
                    className="cursor-pointer group"
                    onClick={() => navigate(`/master/safety-equipments/${equipment.id}`)}
                >
                    <div className="font-medium group-hover:text-blue-600 transition-colors">{equipment.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        Code: {equipment.code} | Type: {equipment.safetyEquipmentType?.name || '-'}
                    </div>
                </div>
            ),
        },
        {
            id: 'category',
            header: 'Category',
            isSortable: true,
            cell: (equipment: SafetyEquipment) => (
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-0">
                    {getCategoryLabel(equipment.category)}
                </Badge>
            ),
        },
        {
            id: 'size',
            header: 'Size',
            isSortable: true,
            cell: (equipment: SafetyEquipment) => equipment.size || '-',
        },
        {
            id: 'currentStock',
            header: 'Current Stock',
            cell: (equipment: SafetyEquipment) => (
                <div className="font-medium">{equipment.currentStock ?? 0}</div>
            ),
        },
        {
            id: 'status',
            header: 'Status',
            isSortable: true,
            cell: (equipment: SafetyEquipment) => (
                <Badge
                    variant="outline"
                    className={`${equipment.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                        } border-0`}
                >
                    {equipment.isActive ? 'Active' : 'Inactive'}
                </Badge>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: (equipment: SafetyEquipment) => (
                <DropdownMenu
                    open={openDropdownId === equipment.id}
                    onOpenChange={(open) => {
                        setOpenDropdownId(open ? equipment.id : null);
                    }}
                >
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {hasPermission('safety-equipment:read') && (
                            <DropdownMenuItem onClick={() => navigate(`/master/safety-equipments/${equipment.id}`)}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                        )}
                        {hasPermission('safety-equipment:update') && (
                            <DropdownMenuItem onClick={() => navigate(`/master/safety-equipments/${equipment.id}/edit`)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                        )}
                        {(hasPermission('safety-equipment:read') || hasPermission('safety-equipment:update')) && hasPermission('safety-equipment:delete') && (
                            <DropdownMenuSeparator />
                        )}
                        {hasPermission('safety-equipment:delete') && (
                            <DropdownMenuItem
                                onClick={(e) => handleDeleteClick(equipment, e)}
                                className="text-red-600 focus:text-red-600"
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Safety Equipment"
                subtitle="Manage safety equipment master data"
                actions={
                    <PermissionGuard permission="safety-equipment:create">
                        <Button onClick={() => navigate('/master/safety-equipments/new')}>
                            <Plus className="mr-2 h-4 w-4" /> Add Equipment
                        </Button>
                    </PermissionGuard>
                }
            >
                <Tabs value={tabValue} className="w-full" onValueChange={handleTabChange}>
                    <TabsList>
                        <TabsTrigger value="all">All Equipment</TabsTrigger>
                        <TabsTrigger value="active">Active</TabsTrigger>
                        <TabsTrigger value="inactive">Inactive</TabsTrigger>
                    </TabsList>
                </Tabs>
            </PageHeader>

            <DataTable
                columns={columns}
                data={equipments}
                isLoading={isLoading}
                pagination={{
                    pageIndex,
                    limit,
                    pageCount: Math.ceil(totalEquipments / limit),
                    onPageChange: handlePageChange,
                    onPageSizeChange: handlePageSizeChange,
                    total: totalEquipments,
                }}
                sorting={sorting}
                onSortingChange={handleSortingChange}
                filterFields={filterFields}
                activeFilters={activeFilters}
                onSearch={handleSearch}
                onApplyFilters={handleApplyFilters}
                searchValue={searchTerm}
                searchPlaceholder="Search by name, code, or size"
            />

            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        handleDialogCancel();
                    }
                }}
                title="Delete Safety Equipment"
                description={`Are you sure you want to delete "${equipmentToDelete?.name}"? This action cannot be undone.`}
                onConfirm={handleDeleteConfirm}
                variant="destructive"
            />
        </>
    );
}
