import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, Briefcase, MoreHorizontal } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import { Badge } from '@/core/components/ui/badge';
import DataTable from '@/core/components/ui/data-table/DataTable';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import jobPositionService from '@/services/jobPositionService';
import { JobPosition } from '@/core/lib/types';

const JobPositionsPage = () => {
  const navigate = useNavigate();
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalJobPositions, setTotalJobPositions] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobPositionToDelete, setJobPositionToDelete] = useState<JobPosition | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [sorting, setSorting] = useState<{ id: string; desc: boolean } | null>(null);

  // Define filter fields
  const filterFields: FilterField[] = [
    {
      id: 'name',
      label: 'Position Name',
      type: 'text',
    },
    {
      id: 'code',
      label: 'Position Code',
      type: 'text',
    },
    {
      id: 'level',
      label: 'Level',
      type: 'text',
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
  ];

  // Fetch job positions
  const fetchJobPositions = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await jobPositionService.getAll({
        page: pageIndex + 1,
        limit,
        isActive: activeTab === 'all' ? undefined : activeTab === 'active',
        search: searchTerm,
        sortBy: sorting?.id,
        sortOrder: sorting?.desc ? 'desc' : 'asc',
      });
      setJobPositions(response.data);
      setTotalJobPositions(response.meta.total);
      
      // Update pageIndex based on returned page from backend
      if (response.meta.page) {
        setPageIndex(response.meta.page - 1); // Convert 1-based to 0-based
      }
    } catch (error) {
      toast.error('Failed to fetch job positions');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, activeTab, searchTerm, sorting]);

  useEffect(() => {
    fetchJobPositions();
  }, [fetchJobPositions]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPageIndex(0);
  };

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0);
  };

  // Handle filter application
  const handleApplyFilters = (filters: FilterValue[]) => {
    const newFilters: Record<string, { value: any; label: string }> = {};
    filters.forEach(filter => {
      const field = filterFields.find(f => f.id === filter.id);
      if (field) {
        let label = '';
        if (field.type === 'select' && field.options) {
          const option = field.options.find(opt => opt.value === filter.value);
          label = option?.label || '';
        } else {
          label = String(filter.value);
        }
        newFilters[filter.id] = { value: filter.value, label };
      }
    });
    setActiveFilters(newFilters);
    setPageIndex(0);
  };

  // Handle sorting
  const handleSortingChange = (newSorting: { id: string; desc: boolean } | null) => {
    setSorting(newSorting);
    setPageIndex(0);
  };

  // Handle delete
  const handleDelete = (jobPosition: JobPosition) => {
    setJobPositionToDelete(jobPosition);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!jobPositionToDelete) return;

    try {
      await jobPositionService.delete(jobPositionToDelete.id);
      toast.success('Job position deleted successfully');
      fetchJobPositions();
    } catch (error) {
      toast.error('Failed to delete job position');
    } finally {
      setDeleteDialogOpen(false);
      setJobPositionToDelete(null);
    }
  };

  // Table columns
  const columns = [
    {
      id: 'name',
      header: 'Position Name',
      cell: (jobPosition: JobPosition) => (
        <div>
          <div className="font-medium">{jobPosition.name}</div>
          <div className="text-xs text-gray-500 mt-1">
            Code: {jobPosition.code}
          </div>
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'level',
      header: 'Level',
      cell: (jobPosition: JobPosition) => (
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-gray-500" />
          <span>{jobPosition.level}</span>
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'description',
      header: 'Description',
      cell: (jobPosition: JobPosition) => jobPosition.description || '-',
      isSortable: true,
    },
    {
      id: 'isActive',
      header: 'Status',
      cell: (jobPosition: JobPosition) => (
        <Badge
          variant="outline"
          className={`${
            jobPosition.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          } border-0`}
        >
          {jobPosition.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
      isSortable: true,
    },
    {
      id: 'actions',
      header: '',
      cell: (jobPosition: JobPosition) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/master/job-positions/${jobPosition.id}`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => handleDelete(jobPosition)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      isSortable: false,
    },
  ];

  return (
    <>
      <PageHeader
        title="Job Positions"
        subtitle="Manage your organization's job positions"
        actions={
          <Button onClick={() => navigate('/master/job-positions/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add Position
          </Button>
        }
      >
        <Tabs defaultValue="all" className="w-full" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All Positions</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <DataTable
        columns={columns}
        data={jobPositions}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalJobPositions / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalJobPositions
        }}
        filterFields={filterFields}
        onSearch={handleSearch}
        onApplyFilters={handleApplyFilters}
        sorting={sorting}
        onSortingChange={handleSortingChange}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Job Position"
        description={`Are you sure you want to delete "${jobPositionToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default JobPositionsPage; 