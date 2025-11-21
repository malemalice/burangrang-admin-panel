import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, MoreHorizontal, Award } from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import DataTable from '@/core/components/ui/data-table/DataTable';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import { useCertificateCategories } from '../hooks/useCertificates';
import certificateCategoryService from '../services/certificateCategoryService';
import { CertificateCategory } from '../types/certificate.types';

const CertificateCategoriesPage = () => {
    const navigate = useNavigate();
    const { categories, isLoading, fetchCategories, pagination } = useCertificateCategories();
    const [pageIndex, setPageIndex] = useState(0);
    const [limit, setLimit] = useState(10);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<CertificateCategory | null>(null);
    const [activeTab, setActiveTab] = useState('all');
    const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<
        Record<string, { value: any; label: string }>
    >({});

    const filterFields: FilterField[] = [
        {
            id: 'name',
            label: 'Category Name',
            type: 'text',
        },
        {
            id: 'code',
            label: 'Category Code',
            type: 'text',
        },
        {
            id: 'certificateType',
            label: 'Certificate Type',
            type: 'select',
            options: [
                { label: 'Personnel License', value: 'PERSONNEL_LICENSE' },
                { label: 'Personnel Certificate', value: 'PERSONNEL_CERTIFICATE' },
                { label: 'Equipment Calibration', value: 'EQUIPMENT_CALIBRATION' },
                { label: 'Equipment Installation', value: 'EQUIPMENT_INSTALLATION' },
                {
                    label: 'Equipment Operational Permit',
                    value: 'EQUIPMENT_OPERATIONAL_PERMIT',
                },
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
        const params: any = {
            page: pageIndex + 1,
            limit,
        };

        if (searchTerm) {
            params.search = searchTerm;
        }

        // Apply filters
        Object.entries(activeFilters).forEach(([key, item]) => {
            if (key === 'status') {
                params.isActive = item.value === 'active';
            } else if (key === 'certificateType') {
                params.certificateType = item.value;
            } else if (key === 'name' || key === 'code') {
                // Text filters are handled by search
                if (!params.search) {
                    params.search = item.value;
                }
            }
        });

        await fetchCategories(params);
    }, [pageIndex, limit, searchTerm, activeFilters, fetchCategories]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDeleteClick = (category: CertificateCategory) => {
        // Close the dropdown for this category first
        setOpenDropdowns((prev) => ({ ...prev, [category.id]: false }));
        // Wait for dropdown animation to complete before opening dialog
        // This prevents aria-hidden conflicts
        setTimeout(() => {
            setCategoryToDelete(category);
            setDeleteDialogOpen(true);
        }, 150); // Wait for dropdown close animation (usually ~100-150ms)
    };

    const handleDeleteConfirm = async () => {
        if (!categoryToDelete) return;

        try {
            await certificateCategoryService.deleteCategory(categoryToDelete.id);
            toast.success('Certificate category deleted successfully');
            fetchData();
        } catch (error: any) {
            console.error('Error deleting category:', error);
            const errorMessage =
                error.response?.data?.message || 'Failed to delete certificate category';
            toast.error(errorMessage);
        } finally {
            setDeleteDialogOpen(false);
            setCategoryToDelete(null);
        }
    };

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        setPageIndex(0);
    };

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        setPageIndex(0);

        // Update filters based on tab selection
        const newFilters: Record<string, { value: any; label: string }> = {};

        // Keep other filters (certificateType, name, code) when changing status tab
        Object.entries(activeFilters).forEach(([key, item]) => {
            if (key !== 'status') {
                newFilters[key] = item;
            }
        });

        if (value === 'all') {
            // Remove status filter only
            setActiveFilters(newFilters);
        } else if (value === 'active') {
            setActiveFilters({
                ...newFilters,
                status: { value: 'active', label: 'Active' },
            });
        } else if (value === 'inactive') {
            setActiveFilters({
                ...newFilters,
                status: { value: 'inactive', label: 'Inactive' },
            });
        }
    };

    const handleApplyFilters = (filters: FilterValue[]) => {
        const newActiveFilters: Record<string, { value: any; label: string }> = {};

        filters.forEach((filter) => {
            if (filter.id === 'certificateType') {
                const typeLabels: Record<string, string> = {
                    PERSONNEL_LICENSE: 'Personnel License',
                    PERSONNEL_CERTIFICATE: 'Personnel Certificate',
                    EQUIPMENT_CALIBRATION: 'Equipment Calibration',
                    EQUIPMENT_INSTALLATION: 'Equipment Installation',
                    EQUIPMENT_OPERATIONAL_PERMIT: 'Equipment Operational Permit',
                };
                newActiveFilters[filter.id] = {
                    value: filter.value,
                    label: typeLabels[String(filter.value)] || String(filter.value),
                };
            } else if (filter.id === 'status') {
                newActiveFilters[filter.id] = {
                    value: filter.value,
                    label: filter.value === 'active' ? 'Active' : 'Inactive',
                };
                // Update active tab to match filter
                setActiveTab(filter.value === 'active' ? 'active' : filter.value === 'inactive' ? 'inactive' : 'all');
            } else {
                newActiveFilters[filter.id] = {
                    value: filter.value,
                    label: String(filter.value),
                };
            }
        });

        setActiveFilters(newActiveFilters);
        setPageIndex(0);
    };

    const columns = [
        {
            id: 'name',
            header: 'Category Name',
            cell: (category: CertificateCategory) => (
                <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-primary" />
                    <div>
                        <div className="font-medium">{category.name}</div>
                        <div className="text-sm text-gray-500">{category.code}</div>
                    </div>
                </div>
            ),
            isSortable: true,
        },
        {
            id: 'certificateType',
            header: 'Certificate Type',
            cell: (category: CertificateCategory) => {
                const typeLabels: Record<string, string> = {
                    PERSONNEL_LICENSE: 'Personnel License',
                    PERSONNEL_CERTIFICATE: 'Personnel Certificate',
                    EQUIPMENT_CALIBRATION: 'Equipment Calibration',
                    EQUIPMENT_INSTALLATION: 'Equipment Installation',
                    EQUIPMENT_OPERATIONAL_PERMIT: 'Equipment Operational Permit',
                };
                return (
                    <div>
                        <div className="font-medium">
                            {typeLabels[category.certificateType] || category.certificateType}
                        </div>
                    </div>
                );
            },
            isSortable: true,
        },
        {
            id: 'description',
            header: 'Description',
            cell: (category: CertificateCategory) => (
                <div className="max-w-md truncate">
                    {category.description || 'No description'}
                </div>
            ),
            isSortable: false,
        },
        {
            id: 'status',
            header: 'Status',
            cell: (category: CertificateCategory) => (
                <Badge
                    variant="outline"
                    className={`${category.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                        } border-0`}
                >
                    {category.isActive ? 'Active' : 'Inactive'}
                </Badge>
            ),
            isSortable: true,
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: (category: CertificateCategory) => {
                const isOpen = openDropdowns[category.id] || false;

                return (
                    <DropdownMenu
                        open={isOpen}
                        onOpenChange={(open) => {
                            setOpenDropdowns((prev) => ({ ...prev, [category.id]: open }));
                        }}
                    >
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                            <DropdownMenuItem
                                onSelect={(e) => {
                                    e.preventDefault();
                                    setOpenDropdowns((prev) => ({ ...prev, [category.id]: false }));
                                    navigate(`/master/certificate-categories/${category.id}/edit`);
                                }}
                            >
                                <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={(e) => {
                                    e.preventDefault();
                                    handleDeleteClick(category);
                                }}
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
            isSortable: false,
        },
    ];

    return (
        <>
            <PageHeader
                title="Certificate Categories"
                subtitle="Manage certificate, license, and permit categories"
                actions={
                    <Button onClick={() => navigate('/master/certificate-categories/new')}>
                        <Plus className="mr-2 h-4 w-4" /> Add Category
                    </Button>
                }
            >
                <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
                    <TabsList>
                        <TabsTrigger value="all">All Categories</TabsTrigger>
                        <TabsTrigger value="active">Active</TabsTrigger>
                        <TabsTrigger value="inactive">Inactive</TabsTrigger>
                    </TabsList>
                </Tabs>
            </PageHeader>

            <DataTable
                columns={columns}
                data={categories}
                isLoading={isLoading}
                pagination={{
                    pageIndex,
                    limit,
                    pageCount: pagination?.totalPages || 0,
                    onPageChange: setPageIndex,
                    onPageSizeChange: setLimit,
                    total: pagination?.total || 0,
                }}
                filterFields={filterFields}
                onSearch={handleSearch}
                onApplyFilters={handleApplyFilters}
            />

            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Certificate Category"
                description={`Are you sure you want to delete category "${categoryToDelete?.name}"? This action cannot be undone.`}
                onConfirm={handleDeleteConfirm}
            />
        </>
    );
};

export default CertificateCategoriesPage;

