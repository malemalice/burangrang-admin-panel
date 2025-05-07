import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, Users, Lock, Check, X, Shield } from 'lucide-react';
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
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FilterField } from '@/components/ui/filter-drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import roleService from '@/services/roleService';
import { Role } from '@/lib/types';

const RolesPage = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pageCount, setPageCount] = useState(0);
  const [totalRoles, setTotalRoles] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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

  // Fetch roles from API
  const fetchRoles = async (filters: Record<string, any> = {}) => {
    setIsLoading(true);
    try {
      // Apply status filter based on active tab
      const statusFilter = activeTab !== 'all' ? activeTab === 'active' : undefined;
      
      // Get roles with pagination and filters
      const response = await roleService.getRoles({
        page: pageIndex + 1, // API is 1-indexed
        pageSize,
        search: searchTerm,
        filters: {
          ...filters,
          isActive: statusFilter
        }
      });
      
      setRoles(response.data);
      setTotalRoles(response.meta.total);
      setPageCount(response.meta.pageCount);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      toast.error('Failed to load roles. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load roles when page changes or filters are applied
  useEffect(() => {
    fetchRoles();
  }, [pageIndex, pageSize, activeTab, searchTerm]);

  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (roleToDelete) {
      setIsLoading(true);
      try {
        await roleService.deleteRole(roleToDelete.id);
        
        // Save the role name for the toast message
        const deletedRoleName = roleToDelete.name;
        
        // Clear role to delete first
        setRoleToDelete(null);
        setDeleteDialogOpen(false);
        
        // Then show toast and refresh the list
        toast.success(`Role "${deletedRoleName}" has been deleted`);
        fetchRoles(); // Refresh the list
      } catch (error) {
        console.error('Failed to delete role:', error);
        toast.error('Failed to delete role. Please try again later.');
      } finally {
        setIsLoading(false);
        setDeleteDialogOpen(false);
        setRoleToDelete(null);
      }
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPageIndex(0); // Reset to first page when tab changes
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0); // Reset to first page when search changes
  };

  const handleApplyFilters = (filters: any[]) => {
    // Convert filters array to object format expected by fetchRoles
    const filterObject: Record<string, any> = {};
    filters.forEach(filter => {
      filterObject[filter.id] = filter.value;
    });
    
    fetchRoles(filterObject);
  };

  const columns = [
    {
      id: 'name',
      header: 'Role Name',
      cell: (role: Role) => (
        <div className="font-medium">{role.name}</div>
      ),
      isSortable: true,
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
        <Badge variant={role.isActive ? 'default' : 'destructive'} className="capitalize">
          {role.isActive ? (
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3" /> Active
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <X className="h-3 w-3" /> Inactive
            </span>
          )}
        </Badge>
      ),
      isFilterable: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (role: Role) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
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
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Role"
        description={`Are you sure you want to delete the role "${roleToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
      />

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
        filterFields={filterFields}
        pagination={{
          pageIndex,
          pageSize,
          pageCount,
          onPageChange: setPageIndex,
          onPageSizeChange: setPageSize,
        }}
        onSearch={handleSearch}
        onApplyFilters={handleApplyFilters}
      />
    </>
  );
};

export default RolesPage;
