import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, UserPlus, Eye, ShieldCheck, Check, X } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FilterField } from '@/components/ui/filter-drawer';
import userService from '@/services/userService';
import { User } from '@/lib/types';

const UsersPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pageCount, setPageCount] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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
      type: 'select',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Manager', value: 'manager' },
        { label: 'User', value: 'user' }
      ]
    },
    {
      id: 'officeId',
      label: 'Office',
      type: 'select',
      options: [
        { label: 'Headquarters', value: 'headquarters' },
        { label: 'Branch Office', value: 'branch' },
        { label: 'Remote Office', value: 'remote' }
      ]
    }
  ];

  // Fetch users from API
  const fetchUsers = async (filters: Record<string, any> = {}) => {
    setIsLoading(true);
    try {
      // Apply status filter based on active tab
      const statusFilter = activeTab !== 'all' ? activeTab === 'active' : undefined;
      
      // Get users with pagination and filters
      const response = await userService.getUsers({
        page: pageIndex + 1, // API is 1-indexed
        pageSize,
        search: searchTerm,
        filters: {
          ...filters,
          isActive: statusFilter
        }
      });
      
      setUsers(response.data);
      setTotalUsers(response.meta.total);
      setPageCount(response.meta.pageCount);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load users when page changes or filters are applied
  useEffect(() => {
    fetchUsers();
  }, [pageIndex, pageSize, activeTab, searchTerm]);

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      setIsLoading(true);
      try {
        await userService.deleteUser(userToDelete.id);
        
        // Save the user name for the toast message
        const deletedUserName = userToDelete.name;
        
        // Clear user to delete first
        setUserToDelete(null);
        setDeleteDialogOpen(false);
        
        // Then show toast and refresh the list
        toast.success(`User "${deletedUserName}" has been deleted`);
        fetchUsers(); // Refresh the list
      } catch (error) {
        console.error('Failed to delete user:', error);
        toast.error('Failed to delete user. Please try again later.');
      } finally {
        setIsLoading(false);
        setDeleteDialogOpen(false);
        setUserToDelete(null);
      }
    }
  };

  const columns = [
    {
      id: 'name',
      header: 'Name',
      isSortable: true,
      cell: (user: User) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar || ""} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'role',
      header: 'Role',
      isSortable: true,
      cell: (user: User) => (
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-gray-500" />
          {user.role || 'User'}
        </div>
      ),
    },
    {
      id: 'office',
      header: 'Office',
      isSortable: true,
      cell: (user: User) => (
        <div>{user.office || '-'}</div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      isSortable: true,
      cell: (user: User) => (
        <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className="capitalize">
          {user.status === 'active' ? (
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
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (user: User) => (
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
    },
  ];

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPageIndex(0); // Reset to first page when tab changes
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0); // Reset to first page when search changes
  };

  const handleApplyFilters = (filters: any[]) => {
    // Convert filters array to object format expected by fetchUsers
    const filterObject: Record<string, any> = {};
    filters.forEach(filter => {
      filterObject[filter.id] = filter.value;
    });
    
    fetchUsers(filterObject);
  };

  return (
    <>
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete User"
        description={`Are you sure you want to delete the user "${userToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
      />

      <PageHeader
        title="Users"
        subtitle="Manage user accounts and permissions"
        actions={
          <Button onClick={() => navigate('/users/new')}>
            <UserPlus className="mr-2 h-4 w-4" /> Add User
          </Button>
        }
      >
        <Tabs defaultValue="all" className="w-full" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All Users</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <DataTable
        columns={columns}
        data={users}
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

export default UsersPage;
