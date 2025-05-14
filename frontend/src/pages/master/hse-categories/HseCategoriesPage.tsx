import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, Shield, MoreHorizontal } from 'lucide-react';
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
import hseCategoryService from '@/services/hseCategoryService';
import { HseCategory } from '@/lib/types';

const HseCategoriesPage = () => {
  const navigate = useNavigate();
  const [hseCategories, setHseCategories] = useState<HseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalHseCategories, setTotalHseCategories] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hseCategoryToDelete, setHseCategoryToDelete] = useState<HseCategory | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [sorting, setSorting] = useState<{ id: string; desc: boolean } | null>(null);

  // Define filter fields
  const filterFields: FilterField[] = [
    {
      id: 'name',
      label: 'Category Name',
      type: 'text',
    },
    {
      id: 'code',
      label: 'Category Code',
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

  // Fetch HSE categories
  const fetchHseCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await hseCategoryService.getAll({
        page: pageIndex + 1,
        limit,
        isActive: activeTab === 'all' ? undefined : activeTab === 'active',
        search: searchTerm,
        sortBy: sorting?.id,
        sortOrder: sorting?.desc ? 'desc' : 'asc',
      });
      setHseCategories(response.data);
      setTotalHseCategories(response.meta.total);
    } catch (error) {
      toast.error('Failed to fetch HSE categories');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, activeTab, searchTerm, sorting]);

  useEffect(() => {
    fetchHseCategories();
  }, [fetchHseCategories]);

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
  const handleDelete = (hseCategory: HseCategory) => {
    setHseCategoryToDelete(hseCategory);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!hseCategoryToDelete) return;

    try {
      await hseCategoryService.delete(hseCategoryToDelete.id);
      toast.success('HSE category deleted successfully');
      fetchHseCategories();
    } catch (error) {
      toast.error('Failed to delete HSE category');
    } finally {
      setDeleteDialogOpen(false);
      setHseCategoryToDelete(null);
    }
  };

  // Table columns
  const columns = [
    {
      id: 'name',
      header: 'Category Name',
      cell: (hseCategory: HseCategory) => (
        <div>
          <div className="font-medium">{hseCategory.name}</div>
          <div className="text-xs text-gray-500 mt-1">
            Code: {hseCategory.code}
          </div>
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'description',
      header: 'Description',
      cell: (hseCategory: HseCategory) => hseCategory.description || '-',
      isSortable: true,
    },
    {
      id: 'isActive',
      header: 'Status',
      cell: (hseCategory: HseCategory) => (
        <Badge
          variant="outline"
          className={`${
            hseCategory.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          } border-0`}
        >
          {hseCategory.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
      isSortable: true,
    },
    {
      id: 'actions',
      header: '',
      cell: (hseCategory: HseCategory) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/master/hse-categories/${hseCategory.id}`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => handleDelete(hseCategory)}
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
        title="HSE Categories"
        subtitle="Manage your organization's health, safety, and environment categories"
        actions={
          <Button onClick={() => navigate('/master/hse-categories/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        }
      >
        <Tabs defaultValue="all" className="w-full" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All Categories</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <DataTable
        columns={columns}
        data={hseCategories}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalHseCategories / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalHseCategories
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
        title="Delete HSE Category"
        description={`Are you sure you want to delete "${hseCategoryToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default HseCategoriesPage; 