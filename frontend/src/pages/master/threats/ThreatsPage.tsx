import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, AlertTriangle, MoreHorizontal, Tag } from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FilterField, FilterValue } from '@/components/ui/filter-drawer';
import threatService from '@/services/threatService';
import hseCategoryService from '@/services/hseCategoryService';
import { Threat, HseCategory } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ThreatsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [threats, setThreats] = useState<Threat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalThreats, setTotalThreats] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [threatToDelete, setThreatToDelete] = useState<Threat | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [sorting, setSorting] = useState<{ id: string; desc: boolean } | null>(null);
  const [hseCategories, setHseCategories] = useState<HseCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  // Get HSE categories for filtering
  useEffect(() => {
    const fetchHseCategories = async () => {
      try {
        const response = await hseCategoryService.getAll({
          limit: 100,
          isActive: true,
        });
        setHseCategories(response.data);
      } catch (error) {
        console.error('Failed to fetch HSE categories:', error);
      }
    };

    fetchHseCategories();
  }, []);

  // Check for category filter in URL
  useEffect(() => {
    const categoryId = searchParams.get('categoryId');
    if (categoryId) {
      setSelectedCategoryId(categoryId);
    }
  }, [searchParams]);

  // Define filter fields
  const filterFields: FilterField[] = [
    {
      id: 'name',
      label: 'Threat Name',
      type: 'text',
    },
    {
      id: 'code',
      label: 'Threat Code',
      type: 'text',
    },
    {
      id: 'hseCategoryId',
      label: 'HSE Category',
      type: 'select',
      options: [
        { label: 'All Categories', value: 'all' },
        ...hseCategories.map(category => ({
          label: category.name,
          value: category.id,
        })),
      ],
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

  // Fetch threats
  const fetchThreats = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await threatService.getAll({
        page: pageIndex + 1,
        limit,
        isActive: activeTab === 'all' ? undefined : activeTab === 'active',
        search: searchTerm,
        sortBy: sorting?.id,
        sortOrder: sorting?.desc ? 'desc' : 'asc',
        hseCategoryId: selectedCategoryId && selectedCategoryId !== 'all' ? selectedCategoryId : undefined,
      });
      setThreats(response.data);
      setTotalThreats(response.meta.total);
      
      // Update pageIndex based on returned page from backend
      if (response.meta.page) {
        setPageIndex(response.meta.page - 1); // Convert 1-based to 0-based
      }
    } catch (error) {
      toast.error('Failed to fetch threats');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, activeTab, searchTerm, sorting, selectedCategoryId]);

  useEffect(() => {
    fetchThreats();
  }, [fetchThreats]);

  // Handle category filter change
  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value);
    // Update URL search params
    if (value && value !== 'all') {
      searchParams.set('categoryId', value);
    } else {
      searchParams.delete('categoryId');
    }
    setSearchParams(searchParams);
    // Reset page index when changing category
    setPageIndex(0);
  };

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
  const handleDelete = (threat: Threat) => {
    setThreatToDelete(threat);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!threatToDelete) return;

    try {
      await threatService.delete(threatToDelete.id);
      toast.success('Threat deleted successfully');
      fetchThreats();
    } catch (error) {
      toast.error('Failed to delete threat. It might have associated mitigations.');
    } finally {
      setDeleteDialogOpen(false);
      setThreatToDelete(null);
    }
  };

  // Table columns
  const columns = [
    {
      id: 'name',
      header: 'Threat Name',
      cell: (threat: Threat) => (
        <div>
          <div className="font-medium">{threat.name}</div>
          <div className="text-xs text-gray-500 mt-1">
            Code: {threat.code}
          </div>
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'hseCategory',
      header: 'HSE Category',
      cell: (threat: Threat) => (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-0">
          <Tag className="h-3.5 w-3.5 mr-1" />
          {threat.hseCategory?.name || '-'}
        </Badge>
      ),
      isSortable: false,
    },
    {
      id: 'description',
      header: 'Description',
      cell: (threat: Threat) => (
        <div className="max-w-md truncate">
          {threat.description || '-'}
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'isActive',
      header: 'Status',
      cell: (threat: Threat) => (
        <Badge
          variant="outline"
          className={`${
            threat.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          } border-0`}
        >
          {threat.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
      isSortable: true,
    },
    {
      id: 'actions',
      header: '',
      cell: (threat: Threat) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/master/threats/${threat.id}`)}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/master/threats/${threat.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => handleDelete(threat)}
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
        title="Threats"
        subtitle="Manage your organization's health, safety, and environment threats"
        actions={
          <Button onClick={() => navigate('/master/threats/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add Threat
          </Button>
        }
      >
        <div className="flex flex-col md:flex-row gap-4 w-full">
          <Tabs defaultValue="all" className="w-full" onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="all">All Threats</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="w-full md:w-64">
            <Select
              value={selectedCategoryId}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {hseCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PageHeader>

      <DataTable
        columns={columns}
        data={threats}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalThreats / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalThreats
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
        title="Delete Threat"
        description={`Are you sure you want to delete "${threatToDelete?.name}"? This action cannot be undone. Note that threats with associated mitigations cannot be deleted.`}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default ThreatsPage; 