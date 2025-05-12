import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, Building, MoreHorizontal } from 'lucide-react';
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
import { Department, PaginationParams } from '@/lib/types';
import departmentService from '@/services/departmentService';
import { FilterField, FilterValue } from '@/components/ui/filter-drawer';

export default function DepartmentsPage() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalDepartments, setTotalDepartments] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});

  // Define filter fields
  const filterFields: FilterField[] = [
    {
      id: 'name',
      label: 'Department Name',
      type: 'text',
    },
    {
      id: 'code',
      label: 'Department Code',
      type: 'text',
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

  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      // Apply status filter based on active tab
      const statusFilter = activeTab !== 'all' ? activeTab === 'active' : undefined;
      
      const params: PaginationParams = {
        page: pageIndex + 1,
        pageSize,
        search: searchTerm,
        filters: {
          ...activeFilters,
          isActive: statusFilter
        }
      };

      const response = await departmentService.getDepartments(params);
      setDepartments(response.data);
      setTotalDepartments(response.meta.total);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      toast.error('Failed to load departments');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch departments when pagination, search, filters, or active tab changes
  useEffect(() => {
    fetchDepartments();
  }, [pageIndex, pageSize, searchTerm, activeFilters, activeTab]);

  const handleDeleteClick = (department: Department) => {
    setDepartmentToDelete(department);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (departmentToDelete) {
      setIsLoading(true);
      try {
        await departmentService.deleteDepartment(departmentToDelete.id);
        toast.success(`Department "${departmentToDelete.name}" has been deleted`);
        // Refresh the department list
        fetchDepartments();
      } catch (error) {
        console.error(`Failed to delete department ${departmentToDelete.id}:`, error);
        toast.error('Failed to delete department');
      } finally {
        setIsLoading(false);
        setDeleteDialogOpen(false);
        setDepartmentToDelete(null);
      }
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0); // Reset to first page on new search
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    // Convert filters array to object format expected by fetchDepartments
    const filterObject: Record<string, any> = {};
    const newActiveFilters: Record<string, { value: any; label: string }> = {};
    
    filters.forEach(filter => {
      // Store the value for API call
      filterObject[filter.id] = filter.value;
      
      // Store the value and label for display
      if (filter.id === 'isActive') {
        const isActive = filter.value === 'true';
        newActiveFilters[filter.id] = {
          value: isActive,
          label: isActive ? 'Active' : 'Inactive'
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

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPageIndex(0);
  };

  const columns = [
    {
      id: 'name',
      header: 'Department Name',
      cell: (department: Department) => (
        <div>
          <div className="font-medium">{department.name}</div>
          <div className="text-xs text-gray-500 mt-1">
            Code: {department.code}
          </div>
        </div>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      cell: (department: Department) => department.description || '-',
    },
    {
      id: 'status',
      header: 'Status',
      cell: (department: Department) => (
        <Badge
          variant="outline"
          className={`${
            department.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          } border-0`}
        >
          {department.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (department: Department) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/master/departments/${department.id}`)}>
              <Building className="mr-2 h-4 w-4" /> View details
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
      >
        <Tabs defaultValue="all" className="w-full" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All Departments</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <DataTable
        columns={columns}
        data={departments}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          pageSize,
          pageCount: Math.ceil(totalDepartments / pageSize),
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
        title="Delete Department"
        description={`Are you sure you want to delete "${departmentToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
