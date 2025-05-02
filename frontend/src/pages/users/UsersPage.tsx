import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, UserPlus, Eye, ShieldCheck } from 'lucide-react';
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

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
}

// Mock data
const mockUsers: User[] = Array(25)
  .fill(null)
  .map((_, i) => ({
    id: `user-${i}`,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: i % 3 === 0 ? 'Admin' : i % 3 === 1 ? 'Manager' : 'User',
    status: i % 5 === 0 ? 'inactive' : i % 7 === 0 ? 'pending' : 'active',
    lastLogin: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toLocaleString(),
  }));

const UsersPage = () => {
  const navigate = useNavigate();
  const [users] = useState<User[]>(mockUsers);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

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
      id: 'role',
      label: 'Role',
      type: 'select',
      options: [
        { label: 'Admin', value: 'Admin' },
        { label: 'Manager', value: 'Manager' },
        { label: 'User', value: 'User' }
      ]
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Pending', value: 'pending' }
      ]
    },
    {
      id: 'lastLogin',
      label: 'Last Login',
      type: 'dateRange'
    }
  ];

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (userToDelete) {
      // API call would go here
      toast.success(`User "${userToDelete.name}" has been deleted`);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
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
            <AvatarImage src="" />
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
          {user.role}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      isSortable: true,
      cell: (user: User) => {
        const statusConfig = {
          active: { label: 'Active', color: 'bg-green-100 text-green-800' },
          inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
          pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
        };
        const config = statusConfig[user.status];

        return (
          <Badge variant="outline" className={`${config.color} border-0`}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      id: 'lastLogin',
      header: 'Last Login',
      isSortable: true,
      cell: (user: User) => <div>{user.lastLogin}</div>,
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

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Manage user accounts and permissions"
        actions={
          <Button onClick={() => navigate('/users/new')}>
            <UserPlus className="mr-2 h-4 w-4" /> Add User
          </Button>
        }
      >
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Users</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <DataTable
        columns={columns}
        data={users}
        filterFields={filterFields}
        pagination={{
          pageIndex,
          pageSize,
          pageCount: Math.ceil(users.length / pageSize),
          onPageChange: setPageIndex,
          onPageSizeChange: setPageSize,
        }}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete User"
        description={`Are you sure you want to delete ${userToDelete?.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
        icon={<Trash2 className="h-5 w-5 text-destructive" />}
      />
    </>
  );
};

export default UsersPage;
