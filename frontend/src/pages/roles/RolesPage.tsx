
import { useState } from 'react';
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

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: number;
  totalPermissions: number;
  users: number;
  isDefault: boolean;
}

// Mock data
const mockRoles: Role[] = [
  {
    id: 'role-1',
    name: 'Administrator',
    description: 'Full access to all features',
    permissions: 42,
    totalPermissions: 42,
    users: 3,
    isDefault: false,
  },
  {
    id: 'role-2',
    name: 'Manager',
    description: 'Manage department resources and users',
    permissions: 30,
    totalPermissions: 42,
    users: 8,
    isDefault: false,
  },
  {
    id: 'role-3',
    name: 'User',
    description: 'Basic user access',
    permissions: 15,
    totalPermissions: 42,
    users: 24,
    isDefault: true,
  },
  {
    id: 'role-4',
    name: 'Accountant',
    description: 'Access to financial data and reports',
    permissions: 18,
    totalPermissions: 42,
    users: 5,
    isDefault: false,
  },
  {
    id: 'role-5',
    name: 'HR',
    description: 'Human resources administration',
    permissions: 25,
    totalPermissions: 42,
    users: 4,
    isDefault: false,
  },
  {
    id: 'role-6',
    name: 'Auditor',
    description: 'Read-only access to all data',
    permissions: 20,
    totalPermissions: 42,
    users: 2,
    isDefault: false,
  },
];

const RolesPage = () => {
  const navigate = useNavigate();
  const [roles] = useState<Role[]>(mockRoles);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (roleToDelete) {
      // API call would go here
      toast.success(`Role "${roleToDelete.name}" has been deleted`);
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    }
  };

  const columns = [
    {
      id: 'name',
      header: 'Role',
      isSortable: true,
      cell: (role: Role) => (
        <div>
          <div className="font-medium flex items-center gap-2">
            {role.name}
            {role.isDefault && (
              <Badge variant="outline" className="ml-2 text-xs">
                Default
              </Badge>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">{role.description}</p>
        </div>
      ),
    },
    {
      id: 'permissions',
      header: 'Permissions',
      cell: (role: Role) => (
        <div className="w-48">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium">
              {role.permissions} / {role.totalPermissions}
            </span>
            <span className="text-xs text-gray-500">
              {Math.round((role.permissions / role.totalPermissions) * 100)}%
            </span>
          </div>
          <Progress value={(role.permissions / role.totalPermissions) * 100} />
        </div>
      ),
    },
    {
      id: 'users',
      header: 'Users',
      isSortable: true,
      cell: (role: Role) => (
        <div className="flex items-center gap-2">
          <Users size={16} className="text-gray-500" />
          <span>{role.users}</span>
        </div>
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
              disabled={role.isDefault}
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
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium">Total Roles</p>
            <p className="text-2xl font-bold">{roles.length}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
        </Card>
        
        <Card className="p-4 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium">Active Permissions</p>
            <p className="text-2xl font-bold">
              {roles.reduce((acc, role) => acc + role.permissions, 0)}
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="h-6 w-6 text-green-600" />
          </div>
        </Card>
        
        <Card className="p-4 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium">Unused Permissions</p>
            <p className="text-2xl font-bold">
              {roles.reduce((acc, role) => acc + (role.totalPermissions - role.permissions), 0)}
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <X className="h-6 w-6 text-red-600" />
          </div>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={roles}
        pagination={{
          pageIndex,
          pageSize,
          pageCount: Math.ceil(roles.length / pageSize),
          onPageChange: setPageIndex,
          onPageSizeChange: setPageSize,
        }}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Role"
        description={`Are you sure you want to delete ${roleToDelete?.name}? This action will remove this role from all users and cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
        icon={<Trash2 className="h-5 w-5 text-destructive" />}
      />
    </>
  );
};

export default RolesPage;
