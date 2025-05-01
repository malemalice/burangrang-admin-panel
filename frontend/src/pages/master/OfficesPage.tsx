
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, MapPin, Phone, Mail, Users, Building } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Office {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  employees: number;
  status: 'active' | 'inactive';
}

// Mock data
const mockOffices: Office[] = [
  {
    id: 'office-1',
    name: 'Headquarters',
    address: '123 Main Street',
    city: 'New York',
    country: 'USA',
    phone: '+1 (555) 123-4567',
    email: 'hq@example.com',
    employees: 120,
    status: 'active',
  },
  {
    id: 'office-2',
    name: 'West Coast Office',
    address: '456 Tech Blvd',
    city: 'San Francisco',
    country: 'USA',
    phone: '+1 (555) 987-6543',
    email: 'sf@example.com',
    employees: 85,
    status: 'active',
  },
  {
    id: 'office-3',
    name: 'European HQ',
    address: '78 King Street',
    city: 'London',
    country: 'UK',
    phone: '+44 (0) 20 7946 0958',
    email: 'london@example.com',
    employees: 65,
    status: 'active',
  },
  {
    id: 'office-4',
    name: 'Asia Pacific HQ',
    address: '42 Marina Bay',
    city: 'Singapore',
    country: 'Singapore',
    phone: '+65 6123 4567',
    email: 'singapore@example.com',
    employees: 50,
    status: 'active',
  },
  {
    id: 'office-5',
    name: 'South Office',
    address: '789 Palm Avenue',
    city: 'Miami',
    country: 'USA',
    phone: '+1 (555) 345-6789',
    email: 'miami@example.com',
    employees: 0,
    status: 'inactive',
  },
];

const OfficesPage = () => {
  const navigate = useNavigate();
  const [offices] = useState<Office[]>(mockOffices);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [officeToDelete, setOfficeToDelete] = useState<Office | null>(null);

  const handleDeleteClick = (office: Office) => {
    setOfficeToDelete(office);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (officeToDelete) {
      // API call would go here
      toast.success(`Office "${officeToDelete.name}" has been deleted`);
      setDeleteDialogOpen(false);
      setOfficeToDelete(null);
    }
  };

  const columns = [
    {
      id: 'name',
      header: 'Office',
      isSortable: true,
      cell: (office: Office) => (
        <div>
          <div className="font-medium">{office.name}</div>
          <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
            <MapPin size={12} />
            {office.city}, {office.country}
          </div>
        </div>
      ),
    },
    {
      id: 'contact',
      header: 'Contact',
      cell: (office: Office) => (
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-gray-500" />
            {office.phone}
          </div>
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-gray-500" />
            {office.email}
          </div>
        </div>
      ),
    },
    {
      id: 'employees',
      header: 'Employees',
      isSortable: true,
      cell: (office: Office) => (
        <div className="flex items-center gap-2">
          <Users size={16} className="text-gray-500" />
          {office.employees}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      isSortable: true,
      cell: (office: Office) => {
        const statusConfig = {
          active: { label: 'Active', color: 'bg-green-100 text-green-800' },
          inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
        };
        const config = statusConfig[office.status];

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
      cell: (office: Office) => (
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
            <DropdownMenuItem onClick={() => navigate(`/master/offices/${office.id}`)}>
              <Building className="mr-2 h-4 w-4" /> View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/master/offices/${office.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDeleteClick(office)}
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
        title="Offices"
        subtitle="Manage your organization's office locations"
        actions={
          <Button onClick={() => navigate('/master/offices/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add Office
          </Button>
        }
      >
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Offices</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <DataTable
        columns={columns}
        data={offices}
        pagination={{
          pageIndex,
          pageSize,
          pageCount: Math.ceil(offices.length / pageSize),
          onPageChange: setPageIndex,
          onPageSizeChange: setPageSize,
        }}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Office"
        description={`Are you sure you want to delete ${officeToDelete?.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
        icon={<Trash2 className="h-5 w-5 text-destructive" />}
      />
    </>
  );
};

export default OfficesPage;
