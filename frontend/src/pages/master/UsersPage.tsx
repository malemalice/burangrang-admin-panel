import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, User as UserIcon, Mail, Building, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/ui/data-table/DataTable';
import PageHeader from '@/components/ui/PageHeader';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FilterField, FilterValue } from '@/components/ui/filter-drawer';
import userService from '@/services/userService';
import type { User } from '@/lib/types';
import type { PaginationParams } from '@/services/userService';

const UsersPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  
  // Define filter fields
  const filterFields: FilterField[] = [
    {
      id: 'name',
      label: 'Name',
      type: 'text',
    },
    {
      id: 'email',
      label: 'Email',
      type: 'text',
    },
    {
      id: 'roleId',
      label: 'Role',
      type: 'select',
      options: [], // Will be populated from roles API
    },
    {
      id: 'officeId',
      label: 'Office',
      type: 'select',
      options: [], // Will be populated from offices API
    },
    {
      id: 'isActive',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' },
      ],
    },
  ];

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params: PaginationParams = {
        page: pageIndex + 1,
        limit: pageSize,
        sortBy: 'firstName',
        sortOrder: 'asc',
        search: searchTerm,
        ...filters,
      };

      const response = await userService.getUsers(params);
      setUsers(response.data);
      setTotalUsers(response.meta.total);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch users when pagination, search, or filters change
  useEffect(() => {
    fetchUsers();
  }, [pageIndex, pageSize, searchTerm, filters]);

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      setIsLoading(true);
      try {
        await userService.deleteUser(userToDelete.id);
        toast.success(`User "${userToDelete.name}" has been deleted`);
        // Refresh the user list
        fetchUsers();
      } catch (error) {
        console.error(`Failed to delete user ${userToDelete.id}:`, error);
        toast.error('Failed to delete user');
      } finally {
        setIsLoading(false);
        setDeleteDialogOpen(false);
        setUserToDelete(null);
      }
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0); // Reset to first page on new search
  };

  const handleApplyFilters = (filterValues: FilterValue[]) => {
    const newFilters: Record<string, any> = {};
    
    filterValues.forEach(filter => {
      newFilters[filter.id] = filter.value;
    });
    
    setFilters(newFilters);
    setPageIndex(0); // Reset to first page on new filters
  };

  const columns = [
    {
      id: 'name',
      header: 'Name',
      cell: (user: User) => (
        <div>
          <div className="font-medium">{user.name}</div>
          <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
            <Mail size={12} />
            {user.email}
          </div>
        </div>
      ),
    },
    {
      id: 'role',
      header: 'Role',
      cell: (user: User) => (
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-gray-500" />
          {user.role}
        </div>
      ),
    },
    {
      id: 'office',
      header: 'Office',
      cell: (user: User) => (
        <div className="flex items-center gap-2">
          <Building size={14} className="text-gray-500" />
          {user.office}
        </div>
      ),
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
          {user.status}
        </Badge>
      ),
    },
    {
      id: 'lastLogin',
      header: 'Last Login',
      cell: (user: User) => user.lastLogin || '-',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (user: User) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Open menu</span>
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
              >
                <path
                  d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                ></path>
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/master/users/${user.id}`)}>
              <UserIcon className="mr-2 h-4 w-4" /> View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/master/users/${user.id}/edit`)}>
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
    },
  ];

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Manage your organization's users"
        actions={
          <Button onClick={() => navigate('/master/users/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add User
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          pageSize,
          pageCount: Math.ceil(totalUsers / pageSize),
          onPageChange: setPageIndex,
          onPageSizeChange: setPageSize,
        }}
        filterFields={filterFields}
        onSearch={handleSearch}
        onApplyFilters={handleApplyFilters}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete User"
        description={`Are you sure you want to delete the user "${userToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default UsersPage; 