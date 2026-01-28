import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Plus, Shield, MoreHorizontal, Eye } from 'lucide-react';
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
import { SafetyEquipment, SafetyEquipmentCategory } from '../types/ppe-master-data.types';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';

export default function SafetyEquipmentsPage() {
    const navigate = useNavigate();
    const {
        equipments,
        totalEquipments,
        currentPage,
        isLoading,
        fetchEquipments,
        deleteEquipment,
    } = useSafetyEquipments();
    const [pageIndex, setPageIndex] = useState(0);
    const [limit, setLimit] = useState(10);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [equipmentToDelete, setEquipmentToDelete] = useState<SafetyEquipment | null>(null);
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

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
            type: 'select',
            options: [
                { label: 'Personal Protective Equipment', value: SafetyEquipmentCategory.PERSONAL_PROTECTIVE_EQUIPMENT },
                { label: 'Safety Equipment', value: SafetyEquipmentCategory.SAFETY_EQUIPMENT },
                { label: 'Emergency Equipment', value: SafetyEquipmentCategory.EMERGENCY_EQUIPMENT },
            ],
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
        // Only include search if it's not empty or only spaces
        const trimmedSearch = searchTerm.trim();
        const finalSearch = trimmedSearch.length > 0 ? trimmedSearch : undefined;

        const params: PaginationParams = {
            page: pageIndex + 1,
            limit,
            search: finalSearch,
            filters: {
                ...Object.entries(activeFilters).reduce((acc: any, [key, item]) => {
                    if (key === 'status') {
                        return {
                            ...acc,
                            isActive: item.value === 'active' ? 'true' : 'false'
                        };
                    }
                    acc[key] = item.value;
                    return acc;
                }, {}),
            }
        };
        await fetchEquipments(params);
    }, [pageIndex, limit, searchTerm, activeFilters, fetchEquipments]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDeleteClick = (equipment: SafetyEquipment, event?: React.MouseEvent) => {
        event?.stopPropagation();
        setOpenDropdownId(null); // Explicitly close the dropdown
        setEquipmentToDelete(equipment);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!equipmentToDelete) return;
        try {
            await deleteEquipment(equipmentToDelete.id);
            setOpenDropdownId(null); // Ensure dropdown is closed
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
        setOpenDropdownId(null); // Ensure dropdown is closed
    };

    const handleSearch = (term: string) => {
        // Trim the search term to avoid issues with whitespace
        const trimmedTerm = term.trim();
        setSearchTerm(trimmedTerm);
        setPageIndex(0);
    };

    const handleApplyFilters = (filters: FilterValue[]) => {
        const newActiveFilters: Record<string, { value: any; label: string }> = {};
        filters.forEach((filter: FilterValue) => {
            if (filter.id === 'status') {
                newActiveFilters[filter.id] = {
                    value: filter.value,
                    label: filter.value === 'active' ? 'Active' : 'Inactive'
                };
            } else if (filter.id === 'category') {
                // Handle category label from filterFields options
                const categoryOption = filterFields.find(f => f.id === 'category')?.options?.find(
                    opt => opt.value === filter.value
                );
                newActiveFilters[filter.id] = {
                    value: filter.value,
                    label: categoryOption?.label || String(filter.value)
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
    };

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        setPageIndex(0);
        if (value === 'all') {
            setActiveFilters({});
        } else if (value === 'active') {
            setActiveFilters({ status: { value: 'active', label: 'Active' } });
        } else if (value === 'inactive') {
            setActiveFilters({ status: { value: 'inactive', label: 'Inactive' } });
        }
    };

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
            cell: (equipment: SafetyEquipment) => (
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-0">
                    {getCategoryLabel(equipment.category)}
                </Badge>
            ),
        },
        {
            id: 'size',
            header: 'Size',
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
                        <DropdownMenuItem onClick={() => navigate(`/master/safety-equipments/${equipment.id}`)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/master/safety-equipments/${equipment.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={(e) => handleDeleteClick(equipment, e)}
                            className="text-red-600 focus:text-red-600"
                        >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
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
                    <Button onClick={() => navigate('/master/safety-equipments/new')}>
                        <Plus className="mr-2 h-4 w-4" /> Add Equipment
                    </Button>
                }
            >
                <Tabs defaultValue="all" className="w-full" onValueChange={handleTabChange}>
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
                    onPageChange: setPageIndex,
                    onPageSizeChange: setLimit,
                    total: totalEquipments
                }}
                filterFields={filterFields}
                activeFilters={activeFilters}
                onSearch={handleSearch}
                onApplyFilters={handleApplyFilters}
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
