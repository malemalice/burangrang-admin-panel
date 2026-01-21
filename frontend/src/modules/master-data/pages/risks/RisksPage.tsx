import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, AlertTriangle, MoreHorizontal, Tag } from 'lucide-react';
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
import { riskService, riskCategoryService } from '@/modules/master-data';
import { Risk, RiskCategory } from '@/core/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';

const RisksPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [risks, setRisks] = useState<Risk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalRisks, setTotalRisks] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [riskToDelete, setRiskToDelete] = useState<Risk | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [sorting, setSorting] = useState<{ id: string; desc: boolean } | null>(null);
  const [riskCategories, setRiskCategories] = useState<RiskCategory[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Get risk categories for filtering
  useEffect(() => {
    const fetchRiskCategories = async () => {
      try {
        const response = await riskCategoryService.getAll({
          limit: 100,
          isActive: true,
        });
        setRiskCategories(response.data);
      } catch (error) {
        console.error('Failed to fetch risk categories:', error);
      }
    };

    fetchRiskCategories();
  }, []);

  // Check for category filter in URL (MDR-017, MDR-018)
  useEffect(() => {
    const categoryId = searchParams.get('categoryId');
    if (categoryId) {
      const cat = riskCategories.find((c) => c.id === categoryId);
      setActiveFilters((prev) => ({ ...prev, riskCategoryId: { value: categoryId, label: cat?.name || categoryId } }));
    }
  }, [searchParams, riskCategories]);

  // Define filter fields
  const filterFields: FilterField[] = [
    {
      id: 'name',
      label: 'Risk Name',
      type: 'text',
    },
    {
      id: 'code',
      label: 'Risk Code',
      type: 'text',
    },
    {
      id: 'riskCategoryId',
      label: 'Risk Category',
      type: 'select',
      options: [
        { label: 'All Categories', value: 'all' },
        ...riskCategories.map(category => ({
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

  // Fetch risks (MDR-012: pass name, code, riskCategoryId, isActive from activeFilters)
  const fetchRisks = useCallback(async () => {
    try {
      setIsLoading(true);
      const isActive =
        activeFilters.status?.value === 'active' ? true : activeFilters.status?.value === 'inactive' ? false : undefined;
      const riskCategoryId =
        activeFilters.riskCategoryId?.value && activeFilters.riskCategoryId.value !== 'all'
          ? activeFilters.riskCategoryId.value
          : undefined;
      const response = await riskService.getAll({
        page: pageIndex + 1,
        limit,
        isActive,
        search: searchTerm || undefined,
        sortBy: sorting?.id,
        sortOrder: sorting?.desc ? 'desc' : 'asc',
        riskCategoryId,
        name: activeFilters.name?.value || undefined,
        code: activeFilters.code?.value || undefined,
      });
      setRisks(response.data);
      setTotalRisks(response.meta.total);

      if (response.meta.page) {
        setPageIndex(response.meta.page - 1);
      }
    } catch (error) {
      toast.error('Failed to fetch risks');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, activeFilters, searchTerm, sorting]);

  useEffect(() => {
    fetchRisks();
  }, [fetchRisks]);

  // Handle category filter change (MDR-017, MDR-018: store in activeFilters so chip appears above list)
  const handleCategoryChange = (value: string) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      if (value === 'all') {
        delete next.riskCategoryId;
      } else {
        const cat = riskCategories.find((c) => c.id === value);
        next.riskCategoryId = { value, label: cat?.name || value };
      }
      return next;
    });
    if (value && value !== 'all') {
      searchParams.set('categoryId', value);
    } else {
      searchParams.delete('categoryId');
    }
    setSearchParams(searchParams);
    setPageIndex(0);
  };

  // Handle tab change (MDR-017, MDR-018: store status in activeFilters so chip appears above list)
  const handleTabChange = (value: string) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      if (value === 'all') {
        delete next.status;
      } else {
        next.status = { value: value as 'active' | 'inactive', label: value === 'active' ? 'Active' : 'Inactive' };
      }
      return next;
    });
    setPageIndex(0);
  };

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0);
  };

  // Handle filter application (MDR-012: include name, code, riskCategoryId, status for API)
  const handleApplyFilters = (filters: FilterValue[]) => {
    const newFilters: Record<string, { value: any; label: string }> = {};
    filters.forEach((filter) => {
      if (filter.id === 'riskCategoryId' && filter.value === 'all') return;
      const field = filterFields.find((f) => f.id === filter.id);
      if (field) {
        let label = '';
        if (field.type === 'select' && field.options) {
          const option = field.options.find((opt) => opt.value === filter.value);
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
  const handleDelete = (risk: Risk, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setOpenDropdownId(null); // Explicitly close the dropdown
    setRiskToDelete(risk);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!riskToDelete) return;

    try {
      await riskService.delete(riskToDelete.id);
      toast.success('Risk deleted successfully');
      setOpenDropdownId(null); // Ensure dropdown is closed
      fetchRisks();
    } catch (error) {
      toast.error('Failed to delete risk. It might have associated mitigations.');
    } finally {
      setDeleteDialogOpen(false);
      setRiskToDelete(null);
    }
  };

  const handleDialogCancel = () => {
    setDeleteDialogOpen(false);
    setRiskToDelete(null);
    setOpenDropdownId(null); // Ensure dropdown is closed
  };

  // Table columns
  const columns = [
    {
      id: 'name',
      header: 'Risk Name',
      cell: (risk: Risk) => (
        <div>
          <div className="font-medium">{risk.name}</div>
          <div className="text-xs text-gray-500 mt-1">
            Code: {risk.code}
          </div>
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'riskCategory',
      header: 'Risk Category',
      cell: (risk: Risk) => (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-0">
          <Tag className="h-3.5 w-3.5 mr-1" />
          {risk.riskCategory?.name || '-'}
        </Badge>
      ),
      isSortable: false,
    },
    {
      id: 'description',
      header: 'Description',
      cell: (risk: Risk) => (
        <div className="max-w-md truncate">
          {risk.description || '-'}
        </div>
      ),
      isSortable: true,
    },
    {
      id: 'isActive',
      header: 'Status',
      cell: (risk: Risk) => (
        <Badge
          variant="outline"
          className={`${
            risk.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          } border-0`}
        >
          {risk.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
      isSortable: true,
    },
    {
      id: 'actions',
      header: '',
      cell: (risk: Risk) => (
        <DropdownMenu
          open={openDropdownId === risk.id}
          onOpenChange={(open) => {
            setOpenDropdownId(open ? risk.id : null);
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/master/risks/${risk.id}`)}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/master/risks/${risk.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={(e) => handleDelete(risk, e)}
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
        title="Risks"
        subtitle="Manage your organization's health, safety, and environment risks"
        actions={
          <Button onClick={() => navigate('/master/risks/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add Risk
          </Button>
        }
      >
        <div className="flex flex-col md:flex-row gap-4 w-full">
          <Tabs
            value={activeFilters.status?.value === 'active' ? 'active' : activeFilters.status?.value === 'inactive' ? 'inactive' : 'all'}
            className="w-full"
            onValueChange={handleTabChange}
          >
            <TabsList>
              <TabsTrigger value="all">All Risks</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="w-full md:w-64">
            <Select value={activeFilters.riskCategoryId?.value || 'all'} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {riskCategories.map((category) => (
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
        data={risks}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalRisks / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalRisks
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
        title="Delete Risk"
        description={`Are you sure you want to delete "${riskToDelete?.name}"? This action cannot be undone. Note that risks with associated mitigations cannot be deleted.`}
        onConfirm={handleDeleteConfirm}
        variant="destructive"
        confirmText="Delete"
      />
    </>
  );
};

export default RisksPage;
