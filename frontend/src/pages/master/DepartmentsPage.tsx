
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, Users, Building2, User } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Department {
  id: string;
  name: string;
  description: string;
  head: {
    id: string;
    name: string;
    avatar?: string;
  } | null;
  office: string;
  employees: number;
  status: 'active' | 'inactive';
}

// Mock data
const mockDepartments: Department[] = [
  {
    id: 'dept-1',
    name: 'Engineering',
    description: 'Software development and IT operations',
    head: {
      id: 'user-5',
      name: 'Jane Smith',
      avatar: '',
    },
    office: 'Headquarters',
    employees: 45,
    status: 'active',
  },
  {
    id: 'dept-2',
    name: 'Marketing',
    description: 'Brand strategy and customer acquisition',
    head: {
      id: 'user-8',
      name: 'John Doe',
      avatar: '',
    },
    office: 'West Coast Office',
    employees: 18,
    status: 'active',
  },
  {
    id: 'dept-3',
    name: 'Human Resources',
    description: 'Employee management and recruitment',
    head: {
      id: 'user-12',
      name: 'Lisa Johnson',
      avatar: '',
    },
    office: 'Headquarters',
    employees: 8,
    status: 'active',
  },
  {
    id: 'dept-4',
    name: 'Finance',
    description: 'Accounting and financial planning',
    head: {
      id: 'user-15',
      name: 'Mike Wilson',
      avatar: '',
    },
    office: 'Headquarters',
    employees: 12,
    status: 'active',
  },
  {
    id: 'dept-5',
    name: 'Customer Support',
    description: 'User assistance and complaint resolution',
    head: null,
    office: 'European HQ',
    employees: 20,
    status: 'active',
  },
  {
    id: 'dept-6',
    name: 'Research',
    description: 'Product research and innovation',
    head: null,
    office: 'South Office',
    employees: 0,
    status: 'inactive',
  },
];

const DepartmentsPage = () => {
  const navigate = useNavigate();
  const [departments] = useState<Department[]>(mockDepartments);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);

  const handleDeleteClick = (department: Department) => {
    setDepartmentToDelete(department);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (departmentToDelete) {
      // API call would go here
      toast.success(`Department "${departmentToDelete.name}" has been deleted`);
      setDeleteDialogOpen(false);
      setDepartmentToDelete(null);
    }
  };

  const columns = [
    {
      id: 'name',
      header: 'Department',
      isSortable: true,
      cell: (department: Department) => (
        <div>
          <div className="font-medium">{department.name}</div>
          <div className="text-xs text-gray-500 mt-1">{department.description}</div>
        </div>
      ),
    },
    {
      id: 'head',
      header: 'Department Head',
      cell: (department: Department) => (
        <div className="flex items-center">
          {department.head ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={department.head.avatar} />
                <AvatarFallback>{department.head.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="text-sm">{department.head.name}</div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <User size={16} /> Not assigned
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'office',
      header: 'Office',
      isSortable: true,
      cell: (department: Department) => (
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-gray-500" />
          <span>{department.office}</span>
        </div>
      ),
    },
    {
      id: 'employees',
      header: 'Employees',
      isSortable: true,
      cell: (department: Department) => (
        <div className="flex items-center gap-2">
          <Users size={16} className="text-gray-500" />
          <span>{department.employees}</span>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      isSortable: true,
      cell: (department: Department) => {
        const statusConfig = {
          active: { label: 'Active', color: 'bg-green-100 text-green-800' },
          inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
        };
        const config = statusConfig[department.status];

        return (
          <Badge variant="outline" className={`${config.color} border-0`}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (department: Department) => (
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
            <DropdownMenuItem onClick={() => navigate(`/master/departments/${department.id}`)}>
              <Users className="mr-2 h-4 w-4" /> View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/master/departments/${department.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDeleteClick(department)}
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
        title="Departments"
        subtitle="Manage your organization's departments"
        actions={
          <Button onClick={() => navigate('/master/departments/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add Department
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={departments}
        pagination={{
          pageIndex,
          pageSize,
          pageCount: Math.ceil(departments.length / pageSize),
          onPageChange: setPageIndex,
          onPageSizeChange: setPageSize,
        }}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Department"
        description={`Are you sure you want to delete ${departmentToDelete?.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
        icon={<Trash2 className="h-5 w-5 text-destructive" />}
      />
    </>
  );
};

export default DepartmentsPage;
