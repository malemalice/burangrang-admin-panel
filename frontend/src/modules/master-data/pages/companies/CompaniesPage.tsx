import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/core/components/ui/badge';
import { Button, ThemeButton } from '@/core/components/ui/button';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import DataTable from '@/core/components/ui/data-table/DataTable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import PageHeader from '@/core/components/ui/PageHeader';
import { PermissionGuard } from '@/core/components/ui/PermissionGuard';
import { Tabs, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { usePermissions } from '@/core/hooks/usePermissions';
import companyService from '../../services/companyService';
import { CompanyDTO } from '../../types/master-data.types';

export default function CompaniesPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [companies, setCompanies] = useState<CompanyDTO[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<CompanyDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const filterFields: FilterField[] = [
    {
      id: 'name',
      label: 'Company Name',
      type: 'text',
    },
    {
      id: 'code',
      label: 'Company Code',
      type: 'text',
    },
    {
      id: 'contactPerson',
      label: 'Contact Person',
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

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await companyService.getCompanies({
        page: pageIndex + 1,
        limit,
        search: searchTerm || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        filters: {
          isActive:
            activeFilters.status?.value === 'active'
              ? true
              : activeFilters.status?.value === 'inactive'
                ? false
                : undefined,
          name: activeFilters.name?.value,
          code: activeFilters.code?.value,
          contactPerson: activeFilters.contactPerson?.value,
        },
      });

      setCompanies(response.data);
      setTotalCompanies(response.meta.total);

      const actualPage = response.meta.page;
      if (actualPage && actualPage - 1 !== pageIndex) {
        setPageIndex(actualPage - 1);
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, searchTerm, activeFilters]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleDeleteClick = (company: CompanyDTO, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setOpenDropdownId(null);
    setCompanyToDelete(company);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!companyToDelete) return;

    setIsLoading(true);
    try {
      await companyService.deleteCompany(companyToDelete.id);
      toast.success(`Company "${companyToDelete.name}" has been deleted`);
      setOpenDropdownId(null);
      fetchCompanies();
    } catch (error) {
      console.error('Failed to delete company:', error);
      toast.error('Failed to delete company');
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    }
  };

  const handleDialogCancel = () => {
    setDeleteDialogOpen(false);
    setCompanyToDelete(null);
    setOpenDropdownId(null);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0);
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    const newActiveFilters: Record<string, { value: any; label: string }> = {};

    filters.forEach((filter) => {
      if (filter.id === 'status') {
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: filter.value === 'active' ? 'Active' : 'Inactive',
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
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPageIndex(0);

    if (value === 'all') {
      setActiveFilters({});
    } else if (value === 'active') {
      setActiveFilters({
        status: { value: 'active', label: 'Active' },
      });
    } else if (value === 'inactive') {
      setActiveFilters({
        status: { value: 'inactive', label: 'Inactive' },
      });
    }
  };

  const columns = [
    {
      id: 'name',
      header: 'Company Name',
      cell: (company: CompanyDTO) => (
        <div>
          <div className="font-medium">{company.name}</div>
          <div className="mt-1 text-xs text-muted-foreground">Code: {company.code}</div>
        </div>
      ),
    },
    {
      id: 'contact',
      header: 'Contact',
      cell: (company: CompanyDTO) => (
        <div>
          <div>{company.contactPerson || '-'}</div>
          <div className="mt-1 text-xs text-muted-foreground">{company.phone || '-'}</div>
          <div className="mt-1 text-xs text-muted-foreground">{company.email || '-'}</div>
        </div>
      ),
    },
    {
      id: 'address',
      header: 'Address',
      cell: (company: CompanyDTO) => company.address || '-',
    },
    {
      id: 'status',
      header: 'Status',
      cell: (company: CompanyDTO) => (
        <Badge
          variant="outline"
          className={company.isActive ? 'border-0 bg-green-100 text-green-800' : 'border-0 bg-gray-100 text-gray-800'}
        >
          {company.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (company: CompanyDTO) => (
        <DropdownMenu
          open={openDropdownId === company.id}
          onOpenChange={(open) => {
            setOpenDropdownId(open ? company.id : null);
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {hasPermission('company:update') && (
              <DropdownMenuItem onClick={() => navigate(`/master/companies/${company.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
            )}
            {hasPermission('company:update') && hasPermission('company:delete') && <DropdownMenuSeparator />}
            {hasPermission('company:delete') && (
              <DropdownMenuItem
                onClick={(event) => handleDeleteClick(company, event)}
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
        title="Companies"
        subtitle="Manage company master data"
        actions={
          <PermissionGuard permission="company:create">
            <ThemeButton onClick={() => navigate('/master/companies/create')}>
              <Plus className="mr-2 h-4 w-4" /> Add Company
            </ThemeButton>
          </PermissionGuard>
        }
      >
        <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All Companies</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <DataTable
        columns={columns}
        data={companies}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalCompanies / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalCompanies,
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
        title="Delete Company"
        description={`Are you sure you want to delete "${companyToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </>
  );
}
