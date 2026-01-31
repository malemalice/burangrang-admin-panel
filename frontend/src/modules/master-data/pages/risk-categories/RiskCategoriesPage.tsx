import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, Eye, MoreHorizontal } from 'lucide-react';
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
import { riskCategoryService } from '@/modules/master-data';
import { RiskCategory } from '@/core/lib/types';

const RiskCategoriesPage = () => {
  const navigate = useNavigate();
  const [riskCategories, setRiskCategories] = useState<RiskCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalRiskCategories, setTotalRiskCategories] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [riskCategoryToDelete, setRiskCategoryToDelete] = useState<RiskCategory | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [sorting, setSorting] = useState<{ id: string; desc: boolean } | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

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

  // Fetch risk categories
  const fetchRiskCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const isActiveFromFilter = activeFilters.status
        ? (activeFilters.status.value === 'active' ? true : activeFilters.status.value === 'inactive' ? false : undefined)
        : undefined;
      const isActive = isActiveFromFilter !== undefined
        ? isActiveFromFilter
        : (activeTab === 'all' ? undefined : activeTab === 'active');
      const response = await riskCategoryService.getAll({
        page: pageIndex + 1,
        limit,
        isActive,
        search: searchTerm || undefined,
        name: activeFilters.name?.value,
        code: activeFilters.code?.value,
        sortBy: sorting?.id,
        sortOrder: sorting?.desc ? 'desc' : 'asc',
      });
      setRiskCategories(response.data);
      setTotalRiskCategories(response.meta.total);
      
      // Update pageIndex based on returned page from backend
      if (response.meta.page) {
        setPageIndex(response.meta.page - 1); // Convert 1-based to 0-based
      }
    } catch (error) {
      toast.error('Failed to fetch risk categories');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, activeTab, searchTerm, activeFilters, sorting]);

  useEffect(() => {
    fetchRiskCategories();
  }, [fetchRiskCategories]);

  // Handle tab change (MDRC-016/017: set activeFilters so filter badges appear above list)
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPageIndex(0);
    if (value === 'all') {
      setActiveFilters({});
    } else if (value === 'active') {
      setActiveFilters({ status: { value: 'active', label: 'Active' } });
    } else if (value === 'inactive') {
      setActiveFilters({ status: { value: 'inactive', label: 'Inactive' } });
    }
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
    // Sync tab: when status is removed from filters, switch to "all"
    if (!filters.some(f => f.id === 'status') && (activeTab === 'active' || activeTab === 'inactive')) {
      setActiveTab('all');
    } else {
      const statusFilter = filters.find(f => f.id === 'status');
      if (statusFilter) {
        setActiveTab(String(statusFilter.value));
      }
    }
  };

  // Handle sorting
  const handleSortingChange = (newSorting: { id: string; desc: boolean } | null) => {
    setSorting(newSorting);
    setPageIndex(0);
  };

  // Handle delete
  const handleDelete = (riskCategory: RiskCategory, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setOpenDropdownId(null); // Explicitly close the dropdown
    setRiskCategoryToDelete(riskCategory);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!riskCategoryToDelete) return;

    try {
      await riskCategoryService.delete(riskCategoryToDelete.id);
      toast.success('Risk category deleted successfully');
      setOpenDropdownId(null); // Ensure dropdown is closed
      fetchRiskCategories();
    } catch (error) {
      toast.error('Failed to delete risk category');
    } finally {
      setDeleteDialogOpen(false);
      setRiskCategoryToDelete(null);
    }
  };

  const handleDialogCancel = () => {
    setDeleteDialogOpen(false);
    setRiskCategoryToDelete(null);
    setOpenDropdownId(null); // Ensure dropdown is closed
  };

  // Table columns
  const columns = [
    {
      id: 'name',
      header: 'Category Name',
      cell: (riskCategory: RiskCategory) => (
        <div>
          <div className="font-medium">{riskCategory.name}</div>
          <div className="text-xs text-gray-500 mt-1">
            Code: {riskCategory.code}
          </div>
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'description',
      header: 'Description',
      cell: (riskCategory: RiskCategory) => riskCategory.description || '-',
      isSortable: true,
    },
    {
      id: 'isActive',
      header: 'Status',
      cell: (riskCategory: RiskCategory) => (
        <Badge
          variant="outline"
          className={`${
            riskCategory.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          } border-0`}
        >
          {riskCategory.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
      isSortable: true,
    },
    {
      id: 'actions',
      header: '',
      cell: (riskCategory: RiskCategory) => (
        <DropdownMenu
          open={openDropdownId === riskCategory.id}
          onOpenChange={(open) => {
            setOpenDropdownId(open ? riskCategory.id : null);
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/master/risk-categories/${riskCategory.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/master/risk-categories/${riskCategory.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={(e) => handleDelete(riskCategory, e)}
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
        title="Risk Categories"
        subtitle="Manage your organization's risk categories"
        actions={
          <Button onClick={() => navigate('/master/risk-categories/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        }
      >
        <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All Categories</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <DataTable
        columns={columns}
        data={riskCategories}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalRiskCategories / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalRiskCategories
        }}
        filterFields={filterFields}
        activeFilters={activeFilters}
        onSearch={handleSearch}
        onApplyFilters={handleApplyFilters}
        sorting={sorting}
        onSortingChange={handleSortingChange}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleDialogCancel();
          }
        }}
        title="Delete Risk Category"
        description={`Are you sure you want to delete "${riskCategoryToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </>
  );
};

export default RiskCategoriesPage;
