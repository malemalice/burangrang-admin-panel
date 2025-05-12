import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, Lock, Check, X, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DataTable from '@/components/ui/data-table/DataTable';
import PageHeader from '@/components/ui/PageHeader';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FilterField, FilterValue } from '@/components/ui/filter-drawer';
import roleService from '@/services/roleService';
import { Role, PaginationParams } from '@/lib/types';

const RolesPage = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalRoles, setTotalRoles] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});

  // Define filter fields for roles
  const filterFields: FilterField[] = [
    {
      id: 'name',
      label: 'Name',
      type: 'text'
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' }
      ]
    }
  ];

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    try {
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
      
      const response = await roleService.getRoles(params);
      setRoles(response.data);
      setTotalRoles(response.meta.total);
      
      // Ensure we have data from the correct page
      const actualPage = response.meta.page;
      if (actualPage && actualPage - 1 !== pageIndex) {
        setPageIndex(actualPage - 1);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      toast.error('Failed to load roles. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, searchTerm, activeFilters]);

  // Load roles when dependencies change
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return;
    
    setIsLoading(true);
    try {
      await roleService.deleteRole(roleToDelete.id);
      toast.success(`Role "${roleToDelete.name}" has been deleted`);
      fetchRoles();
    } catch (error) {
      console.error('Failed to delete role:', error);
      toast.error('Failed to delete role. Please try again later.');
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPageIndex(0);
    
    // Update filters based on tab
    if (value === 'all') {
      setActiveFilters({});
    } else if (value === 'active') {
      setActiveFilters({
        status: { value: 'active', label: 'Active' }
      });
    } else if (value === 'inactive') {
      setActiveFilters({
        status: { value: 'inactive', label: 'Inactive' }
      });
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0); // Reset to first page when search changes
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    const newActiveFilters: Record<string, { value: any; label: string }> = {};
    
    filters.forEach(filter => {
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
    setPageIndex(0); // Reset to first page on new filters
  };

  const columns = [
    {
      id: 'name',
      header: 'Role Name',
      cell: (role: Role) => (
        <div className="font-medium">{role.name}</div>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      cell: (role: Role) => role.description || '-',
    },
    {
      id: 'permissions',
      header: 'Permissions',
      cell: (role: Role) => {
        const count = role.permissions?.length || 0;
        return (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              {count}
            </Badge>
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: (role: Role) => (
        <Badge
          variant="outline"
          className={`${
            role.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          } border-0`}
        >
          {role.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (role: Role) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/roles/${role.id}`)}>
              <Lock className="mr-2 h-4 w-4" /> Manage permissions
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/roles/${role.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDeleteClick(role)}
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
        title="Roles"
        subtitle="Manage roles and permissions"
        actions={
          <Button onClick={() => navigate('/roles/new')}>
            <Plus className="mr-2 h-4 w-4" /> Create Role
          </Button>
        }
      >
        <Tabs defaultValue="all" className="w-full" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All Roles</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <DataTable
        columns={columns}
        data={roles}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalRoles / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalRoles
        }}
        filterFields={filterFields}
        onSearch={handleSearch}
        onApplyFilters={handleApplyFilters}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Role"
        description={`Are you sure you want to delete the role "${roleToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default RolesPage;
