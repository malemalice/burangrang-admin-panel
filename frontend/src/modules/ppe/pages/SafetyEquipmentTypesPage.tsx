import { useState, useEffect, useCallback } from 'react';
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

export default function SafetyEquipmentTypesPage() {
    const navigate = useNavigate();
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
    const [dropdownOpenStates, setDropdownOpenStates] = useState<Record<string, boolean>>({});

    const filterFields: FilterField[] = [
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
                        undefined
            }
        };
        await fetchTypes(params);
    }, [pageIndex, limit, searchTerm, activeFilters, fetchTypes]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDeleteClick = (type: SafetyEquipmentType) => {
        // Close all dropdowns before opening delete dialog
        setDropdownOpenStates({});
        setTypeToDelete(type);
        // Use setTimeout to ensure dropdown is fully closed before opening dialog
        setTimeout(() => {
            setDeleteDialogOpen(true);
        }, 0);
    };

    const handleDeleteConfirm = async () => {
        if (!typeToDelete) return;
        try {
            await deleteType(typeToDelete.id);
            // Close all dropdowns and clear state after successful delete
            setDropdownOpenStates({});
            fetchData();
        } catch (error) {
            // Error already handled in hook with toast notification
        } finally {
            setDeleteDialogOpen(false);
            setTypeToDelete(null);
        }
    };

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        setPageIndex(0);
    };

    const handleApplyFilters = (filters: any[]) => {
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

    const columns = [
        {
            id: 'name',
            header: 'Type Name',
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
            cell: (type: SafetyEquipmentType) => type.description || '-',
        },
        {
            id: 'status',
            header: 'Status',
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
                    open={dropdownOpenStates[type.id]}
                    onOpenChange={(open) => setDropdownOpenStates(prev => ({ ...prev, [type.id]: open }))}
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
                            onClick={() => handleDeleteClick(type)}
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
                title="Safety Equipment Types"
                subtitle="Manage safety equipment types"
                actions={
                    <Button onClick={() => navigate('/master/safety-equipment-types/new')}>
                        <Plus className="mr-2 h-4 w-4" /> Add Type
                    </Button>
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
                filterFields={filterFields}
                onSearch={handleSearch}
                onApplyFilters={handleApplyFilters}
            />

            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Safety Equipment Type"
                description={`Are you sure you want to delete "${typeToDelete?.name}"? This action cannot be undone.`}
                onConfirm={handleDeleteConfirm}
            />
        </>
    );
}

