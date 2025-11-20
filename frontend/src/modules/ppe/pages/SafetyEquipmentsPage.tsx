import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useSafetyEquipments } from '../hooks/useSafetyEquipments';
import { SafetyEquipment, SafetyEquipmentCategory } from '../types/ppe-master-data.types';
import { FilterField } from '@/core/components/ui/filter-drawer';

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
    const [dropdownOpenStates, setDropdownOpenStates] = useState<Record<string, boolean>>({});

    const filterFields: FilterField[] = [
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
    ];

    const fetchData = useCallback(async () => {
        const params: PaginationParams = {
            page: pageIndex + 1,
            limit,
            search: searchTerm,
            filters: {
                ...Object.entries(activeFilters).reduce((acc, [key, item]) => ({
                    ...acc,
                    [key]: item.value
                }), {}),
                isActive: activeFilters.status?.value === 'active' ? true :
                    activeFilters.status?.value === 'inactive' ? false :
                        undefined,
                category: activeFilters.category?.value,
                safetyEquipmentTypeId: activeFilters.safetyEquipmentTypeId?.value,
            }
        };
        await fetchEquipments(params);
    }, [pageIndex, limit, searchTerm, activeFilters, fetchEquipments]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDeleteClick = (equipment: SafetyEquipment) => {
        // Close all dropdowns before opening delete dialog
        setDropdownOpenStates({});
        setEquipmentToDelete(equipment);
        // Use setTimeout to ensure dropdown is fully closed before opening dialog
        setTimeout(() => {
            setDeleteDialogOpen(true);
        }, 0);
    };

    const handleDeleteConfirm = async () => {
        if (!equipmentToDelete) return;
        try {
            await deleteEquipment(equipmentToDelete.id);
            // Close all dropdowns and clear state after successful delete
            setDropdownOpenStates({});
            fetchData();
        } catch (error) {
            // Error already handled in hook with toast notification
        } finally {
            setDeleteDialogOpen(false);
            setEquipmentToDelete(null);
        }
    };

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        setPageIndex(0);
    };

    const handleApplyFilters = (filters: any[]) => {
        const newActiveFilters: Record<string, { value: any; label: string }> = {};
        filters.forEach((filter: any) => {
            newActiveFilters[filter.id] = {
                value: filter.value,
                label: String(filter.value)
            };
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
                <div>
                    <div className="font-medium">{equipment.name}</div>
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
                    open={dropdownOpenStates[equipment.id]}
                    onOpenChange={(open) => setDropdownOpenStates(prev => ({ ...prev, [equipment.id]: open }))}
                >
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/master/safety-equipments/${equipment.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => handleDeleteClick(equipment)}
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
                onSearch={handleSearch}
                onApplyFilters={handleApplyFilters}
            />

            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Safety Equipment"
                description={`Are you sure you want to delete "${equipmentToDelete?.name}"? This action cannot be undone.`}
                onConfirm={handleDeleteConfirm}
            />
        </>
    );
}

