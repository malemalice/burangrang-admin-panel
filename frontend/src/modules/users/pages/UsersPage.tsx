import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, UserPlus, Eye, ShieldCheck, Check, X, Building, MoreHorizontal, Briefcase } from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';
import { Button, ThemeButton } from '@/core/components/ui/button';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/core/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import userService from '../services/userService';
import { roleService } from '@/modules/roles';
import { officeService, departmentService, jobPositionService } from '@/modules/master-data';
import { User } from '@/core/lib/types';

const UsersPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [offices, setOffices] = useState<{ id: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [jobPositions, setJobPositions] = useState<{ id: string; name: string }[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [dropdownOpenStates, setDropdownOpenStates] = useState<Record<string, boolean>>({});

  // Define filter fields for users
  const filterFields: FilterField[] = [
    {
      id: 'name',
      label: 'Name',
      type: 'text'
    },
    {
      id: 'email',
      label: 'Email',
      type: 'text'
    },
    {
      id: 'roleId',
      label: 'Role',
      type: 'searchableSelect',
      options: roles.map(role => ({
        label: role.name,
        value: role.id
      }))
    },
    {
      id: 'officeId',
      label: 'Office',
      type: 'searchableSelect',
      options: offices.map(office => ({
        label: office.name,
        value: office.id
      }))
    },
    {
      id: 'departmentId',
      label: 'Department',
      type: 'searchableSelect',
      options: departments.map(department => ({
        label: department.name,
        value: department.id
      }))
    },
    {
      id: 'jobPositionId',
      label: 'Job Position',
      type: 'searchableSelect',
      options: jobPositions.map(position => ({
        label: position.name,
        value: position.id
      }))
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

  // Fetch roles and offices for filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [rolesResponse, officesResponse, departmentsResponse, jobPositionsResponse] = await Promise.all([
          roleService.getRoles({ page: 1, limit: 100 }),
          officeService.getOffices({ page: 1, limit: 100 }),
          departmentService.getDepartments({ page: 1, limit: 100 }),
          jobPositionService.getAll({ page: 1, limit: 100 })
        ]);

        setRoles(rolesResponse.data);
        setOffices(officesResponse.data);
        setDepartments(departmentsResponse.data);
        setJobPositions(jobPositionsResponse.data);
      } catch (error) {
        console.error('Failed to fetch filter options:', error);
        toast.error('Failed to load filter options');
      }
    };

    fetchFilterOptions();
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: pageIndex + 1,
        limit,
        search: searchTerm,
        filters: {
          ...Object.entries(activeFilters).reduce((acc, [key, item]) => {
            // Map status to isActive for backend compatibility
            if (key === 'status') {
              return {
                ...acc,
                isActive: item.value === 'active' ? 'true' : 'false'
              };
            }
            return {
              ...acc,
              [key]: item.value
            };
          }, {}),
          // Handle status filter specifically
          ...(activeFilters.status?.value ? {
            isActive: activeFilters.status.value === 'active' ? 'true' : 'false'
          } : {})
        }
      };

      const response = await userService.getUsers(params);
      setUsers(response.data);
      setTotalUsers(response.meta.total);
      
      // Ensure we have data from the correct page
      const actualPage = response.meta.page;
      if (actualPage && actualPage - 1 !== pageIndex) {
        setPageIndex(actualPage - 1);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, searchTerm, activeFilters]);

  // Fetch users when dependencies change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDropdownOpenChange = (id: string, open: boolean) => {
    setDropdownOpenStates(prev => ({
      ...prev,
      [id]: open
    }));
  };

  const handleDeleteClick = (user: User) => {
    // Close the dropdown menu for this user
    setDropdownOpenStates(prev => ({
      ...prev,
      [user.id]: false
    }));
    
    // Set user to delete and open the dialog
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    setIsLoading(true);
    try {
      await userService.deleteUser(userToDelete.id);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0); // Reset to first page on new search
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

  const handleApplyFilters = (filters: FilterValue[]) => {
    const newActiveFilters: Record<string, { value: any; label: string }> = {};
    
    filters.forEach(filter => {
      if (filter.id === 'roleId') {
        const role = roles.find(r => r.id === filter.value);
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: role?.name || ''
        };
      } else if (filter.id === 'officeId') {
        const office = offices.find(o => o.id === filter.value);
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: office?.name || ''
        };
      } else if (filter.id === 'departmentId') {
        const department = departments.find(d => d.id === filter.value);
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: department?.name || ''
        };
      } else if (filter.id === 'jobPositionId') {
        const position = jobPositions.find(p => p.id === filter.value);
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: position?.name || ''
        };
      } else if (filter.id === 'status') {
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
      header: 'Name',
      cell: (user: User) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>
              {user.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      ),
      isSortable: true
    },
    {
      id: 'role',
      header: 'Role',
      cell: (user: User) => (
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-gray-500" />
          <span>{user.role}</span>
        </div>
      ),
      isSortable: true
    },
    {
      id: 'office',
      header: 'Office',
      cell: (user: User) => (
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-gray-500" />
          <span>{user.office}</span>
        </div>
      ),
      isSortable: true
    },
    {
      id: 'department',
      header: 'Department',
      cell: (user: User) => (
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-gray-500" />
          <span>{user.department || '-'}</span>
        </div>
      ),
      isSortable: true
    },
    {
      id: 'position',
      header: 'Job Position',
      cell: (user: User) => (
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-gray-500" />
          <span>{user.position || '-'}</span>
        </div>
      ),
      isSortable: true
    },
    {
      id: 'status',
      header: 'Status',
      cell: (user: User) => (
        <Badge
          variant="outline"
          className={`${
            user.status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          } border-0`}
        >
          {user.status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      ),
      isSortable: true
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (user: User) => (
        <DropdownMenu 
          open={dropdownOpenStates[user.id]} 
          onOpenChange={(open) => handleDropdownOpenChange(user.id, open)}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/users/${user.id}`)}>
              <Eye className="mr-2 h-4 w-4" /> View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/users/${user.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDeleteClick(user)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      isSortable: false
    }
  ];

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Manage your organization's users"
        actions={
          <ThemeButton onClick={() => navigate('/users/new')}>
            <UserPlus className="mr-2 h-4 w-4" /> Add User
          </ThemeButton>
        }
      >
        <Tabs defaultValue="all" className="w-full" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all">All Users</TabsTrigger>
            <TabsTrigger value="active" data-testid="tab-active">Active</TabsTrigger>
            <TabsTrigger value="inactive" data-testid="tab-inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalUsers / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalUsers
        }}
        filterFields={filterFields}
        onSearch={handleSearch}
        onApplyFilters={handleApplyFilters}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete User"
        description={`Are you sure you want to delete "${userToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default UsersPage;
