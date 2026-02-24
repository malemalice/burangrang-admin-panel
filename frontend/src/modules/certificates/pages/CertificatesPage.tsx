import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Edit,
    Trash2,
    Plus,
    Eye,
    MoreHorizontal,
    Award,
    Calendar,
    AlertTriangle,
} from 'lucide-react';
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
import { useCertificates } from '../hooks/useCertificates';
import { useCertificateCategories } from '../hooks/useCertificates';
import { Certificate, CertificateSearchParams } from '../types/certificate.types';
import { departmentService } from '@/modules/master-data';
import { userService } from '@/modules/users';
import { PermissionGuard } from '@/core/components/ui/PermissionGuard';
import { usePermissions } from '@/core/hooks/usePermissions';

const CertificatesPage = () => {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const {
        certificates,
        totalCertificates,
        currentPage,
        isLoading,
        fetchCertificates,
        deleteCertificate,
    } = useCertificates();
    const { categories } = useCertificateCategories();
    const [pageIndex, setPageIndex] = useState(0);
    const [limit, setLimit] = useState(10);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [certificateToDelete, setCertificateToDelete] = useState<Certificate | null>(null);
    const [activeTab, setActiveTab] = useState('all');
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
    const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
    const [activeFilters, setActiveFilters] = useState<
        Record<string, { value: any; label: string }>
    >({});

    // Define filter fields
    const filterFields: FilterField[] = useMemo(() => [
        {
            id: 'categoryId',
            label: 'Category',
            type: 'searchableSelect',
            options: categories.map((cat) => ({
                label: cat.name,
                value: cat.id,
            })),
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
            id: 'departmentId',
            label: 'Department',
            type: 'searchableSelect',
            options: departments.map((dept) => ({
                label: dept.name,
                value: dept.id,
            })),
        },
        {
            id: 'personnelId',
            label: 'Personnel',
            type: 'searchableSelect',
            options: users.map((user) => ({
                label: user.name,
                value: user.id,
            })),
        },
        {
            id: 'personnelName',
            label: 'Personnel name',
            type: 'text',
        },
        {
            id: 'expired',
            label: 'Expired',
            type: 'select',
            options: [
                { label: 'Yes', value: 'true' },
                { label: 'No', value: 'false' },
            ],
        },
        {
            id: 'expiringSoon',
            label: 'Expiring Soon',
            type: 'select',
            options: [
                { label: 'Yes', value: 'true' },
                { label: 'No', value: 'false' },
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
    ], [categories, departments, users]);

    // Fetch filter options
    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                const [departmentsResponse, usersResponse] = await Promise.all([
                    departmentService.getDepartments({ page: 1, limit: 100, options: true }),
                    userService.getUsers({ page: 1, limit: 100, options: true }),
                ]);

                setDepartments(departmentsResponse.data);
                setUsers(
                    usersResponse.data.map((u) => ({
                        id: u.id,
                        name: u.name,
                    })),
                );
            } catch (error) {
                console.error('Failed to fetch filter options:', error);
                toast.error('Failed to load filter options');
            }
        };

        fetchFilterOptions();
    }, []);

    const fetchData = useCallback(async () => {
        const params: CertificateSearchParams = {
            page: pageIndex + 1,
            limit,
            search: searchTerm,
        };

        // Apply filters
        Object.entries(activeFilters).forEach(([key, item]) => {
            if (key === 'status') {
                params.isActive = item.value === 'active';
            } else if (key === 'expired') {
                params.expired = item.value === 'true';
            } else if (key === 'expiringSoon') {
                params.expiringSoon = item.value === 'true';
            } else if (key === 'categoryId') {
                params.categoryId = item.value;
            } else if (key === 'certificateType') {
                params.certificateType = item.value as any;
            } else if (key === 'departmentId') {
                params.departmentId = item.value;
            } else if (key === 'personnelId') {
                params.personnelId = item.value;
            } else if (key === 'personnelName' && item.value) {
                params.personnelName = item.value;
            }
        });

        await fetchCertificates(params);
    }, [pageIndex, limit, searchTerm, activeFilters, fetchCertificates]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDeleteClick = useCallback((certificate: Certificate, event?: React.MouseEvent) => {
        event?.stopPropagation();
        setOpenDropdownId(null); // Explicitly close the dropdown
        setCertificateToDelete(certificate);
        setDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!certificateToDelete) return;

        try {
            await deleteCertificate(certificateToDelete.id);
            setOpenDropdownId(null); // Ensure dropdown is closed
            fetchData();
        } catch (error) {
            console.error('Error deleting certificate:', error);
        } finally {
            setDeleteDialogOpen(false);
            setCertificateToDelete(null);
        }
    }, [certificateToDelete, deleteCertificate, fetchData]);

    const handleDialogCancel = useCallback(() => {
        setDeleteDialogOpen(false);
        setCertificateToDelete(null);
        setOpenDropdownId(null); // Ensure dropdown is closed
    }, []);

    const handleSearch = useCallback((term: string) => {
        setSearchTerm(term);
        setPageIndex(0);
    }, []);

    const handleTabChange = useCallback((value: string) => {
        setActiveTab(value);
        setPageIndex(0);

        // Keep other filters when changing tabs
        const newFilters: Record<string, { value: any; label: string }> = {};

        // Preserve non-status filters
        Object.entries(activeFilters).forEach(([key, item]) => {
            if (key !== 'status' && key !== 'expired' && key !== 'expiringSoon') {
                newFilters[key] = item;
            }
        });

        if (value === 'all') {
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
        } else if (value === 'expired') {
            setActiveFilters({
                ...newFilters,
                expired: { value: 'true', label: 'Expired' },
            });
        } else if (value === 'expiringSoon') {
            setActiveFilters({
                ...newFilters,
                expiringSoon: { value: 'true', label: 'Expiring Soon' },
            });
        }
    }, [activeFilters]);

    const handleApplyFilters = useCallback((filters: FilterValue[]) => {
        const newActiveFilters: Record<string, { value: any; label: string }> = {};

        filters.forEach((filter) => {
            if (filter.id === 'categoryId') {
                const category = categories.find((c) => c.id === filter.value);
                newActiveFilters[filter.id] = {
                    value: filter.value,
                    label: category?.name || '',
                };
            } else if (filter.id === 'departmentId') {
                const department = departments.find((d) => d.id === filter.value);
                newActiveFilters[filter.id] = {
                    value: filter.value,
                    label: department?.name || '',
                };
            } else if (filter.id === 'personnelId') {
                const user = users.find((u) => u.id === filter.value);
                newActiveFilters[filter.id] = {
                    value: filter.value,
                    label: user?.name || '',
                };
            } else if (filter.id === 'personnelName') {
                newActiveFilters[filter.id] = {
                    value: filter.value,
                    label: filter.value ? `Personnel name: ${String(filter.value)}` : 'Personnel name',
                };
            } else if (filter.id === 'certificateType') {
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
            } else if (filter.id === 'expired') {
                newActiveFilters[filter.id] = {
                    value: filter.value,
                    label: filter.value === 'true' ? 'Expired' : 'Not Expired',
                };
            } else if (filter.id === 'expiringSoon') {
                newActiveFilters[filter.id] = {
                    value: filter.value,
                    label: filter.value === 'true' ? 'Expiring Soon' : 'Not Expiring Soon',
                };
            } else {
                newActiveFilters[filter.id] = {
                    value: filter.value,
                    label: String(filter.value),
                };
            }
        });

        setActiveFilters(newActiveFilters);
        setPageIndex(0);
    }, [categories, departments, users]);

    const formatDate = useCallback((dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }, []);

    const columns = useMemo(() => [
        {
            id: 'certificateNumber',
            header: 'Certificate Number',
            cell: (certificate: Certificate) => (
                <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-primary" />
                    <div>
                        <div className="font-medium">{certificate.certificateNumber}</div>
                        <div className="text-sm text-gray-500">{certificate.certificateName}</div>
                    </div>
                </div>
            ),
            isSortable: true,
        },
        {
            id: 'category',
            header: 'Category',
            cell: (certificate: Certificate) => (
                <div>
                    <div className="font-medium">{certificate.category?.name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{certificate.certificateType}</div>
                </div>
            ),
            isSortable: true,
        },
        {
            id: 'personnelEquipment',
            header: 'Personnel / Equipment',
            cell: (certificate: Certificate) => (
                <div>
                    {certificate.personnelName ? (
                        <div className="font-medium">{certificate.personnelName}</div>
                    ) : certificate.personnel ? (
                        <div className="font-medium">
                            {certificate.personnel.firstName} {certificate.personnel.lastName}
                        </div>
                    ) : certificate.equipmentName ? (
                        <div className="font-medium">{certificate.equipmentName}</div>
                    ) : (
                        <div className="text-gray-400">N/A</div>
                    )}
                </div>
            ),
            isSortable: false,
        },
        {
            id: 'validityDate',
            header: 'Validity Date',
            cell: (certificate: Certificate) => (
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                        <div className="font-medium">{formatDate(certificate.validityDate)}</div>
                        {certificate.isExpired && (
                            <Badge variant="destructive" className="mt-1">
                                Expired
                            </Badge>
                        )}
                        {certificate.isExpiringSoon && !certificate.isExpired && (
                            <Badge
                                variant="outline"
                                className="mt-1 border-yellow-500 text-yellow-700 bg-yellow-50 font-medium"
                            >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Expiring Soon
                            </Badge>
                        )}
                    </div>
                </div>
            ),
            isSortable: true,
        },
        {
            id: 'department',
            header: 'Department',
            cell: (certificate: Certificate) => (
                <div>{certificate.department || 'N/A'}</div>
            ),
            isSortable: true,
        },
        {
            id: 'status',
            header: 'Status',
            cell: (certificate: Certificate) => (
                <Badge
                    variant="outline"
                    className={`${certificate.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                        } border-0`}
                >
                    {certificate.isActive ? 'Active' : 'Inactive'}
                </Badge>
            ),
            isSortable: true,
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: (certificate: Certificate) => {
                return (
                    <DropdownMenu
                        open={openDropdownId === certificate.id}
                        onOpenChange={(open) => {
                            setOpenDropdownId(open ? certificate.id : null);
                        }}
                    >
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {hasPermission('certificate:read') && (
                                <DropdownMenuItem
                                    onSelect={(e) => {
                                        e.preventDefault();
                                        setOpenDropdownId(null);
                                        navigate(`/certificates/${certificate.id}`);
                                    }}
                                >
                                    <Eye className="mr-2 h-4 w-4" /> View details
                                </DropdownMenuItem>
                            )}
                            {hasPermission('certificate:update') && (
                                <DropdownMenuItem
                                    onSelect={(e) => {
                                        e.preventDefault();
                                        setOpenDropdownId(null);
                                        navigate(`/certificates/${certificate.id}/edit`);
                                    }}
                                >
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                            )}
                            {(hasPermission('certificate:read') || hasPermission('certificate:update')) && hasPermission('certificate:delete') && (
                                <DropdownMenuSeparator />
                            )}
                            {hasPermission('certificate:delete') && (
                                <DropdownMenuItem
                                    onSelect={(e) => {
                                        e.preventDefault();
                                        handleDeleteClick(certificate, e as any);
                                    }}
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                    <Trash2 className="mr-2 h-4 w-4 text-red-600" /> Delete
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
            isSortable: false,
        },
    ], [categories, departments, users, openDropdownId, navigate, handleDeleteClick, formatDate, hasPermission]);

    return (
        <>
            <PageHeader
                title="Certificates"
                subtitle="Manage your organization's certificates and licenses"
                actions={
                    <PermissionGuard permission="certificate:create">
                        <Button onClick={() => navigate('/certificates/new')}>
                            <Plus className="mr-2 h-4 w-4" /> Add Certificate
                        </Button>
                    </PermissionGuard>
                }
            >
                <Tabs defaultValue="all" className="w-full" onValueChange={handleTabChange}>
                    <TabsList>
                        <TabsTrigger value="all">All Certificates</TabsTrigger>
                        <TabsTrigger value="active">Active</TabsTrigger>
                        <TabsTrigger value="inactive">Inactive</TabsTrigger>
                        <TabsTrigger value="expired">Expired</TabsTrigger>
                        <TabsTrigger value="expiringSoon">Expiring Soon</TabsTrigger>
                    </TabsList>
                </Tabs>
            </PageHeader>

            <DataTable
                columns={columns}
                data={certificates}
                isLoading={isLoading}
                pagination={{
                    pageIndex,
                    limit,
                    pageCount: Math.ceil(totalCertificates / limit),
                    onPageChange: setPageIndex,
                    onPageSizeChange: setLimit,
                    total: totalCertificates,
                }}
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
                title="Delete Certificate"
                description={`Are you sure you want to delete certificate "${certificateToDelete?.certificateNumber}"? This action cannot be undone.`}
                onConfirm={handleDeleteConfirm}
                variant="destructive"
            />
        </>
    );
};

export default CertificatesPage;

