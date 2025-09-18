import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, Eye, MoreHorizontal, Tag } from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import DataTable from '@/core/components/ui/data-table/DataTable';
import PageHeader from '@/core/components/ui/PageHeader';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { FilterField, FilterValue } from '@/core/components/ui/filter-drawer';
import { useProductTypes } from '../hooks/useProductTypes';
import { ProductType } from '../services/productTypesService';

const ProductTypesPage = () => {
  const navigate = useNavigate();
  const { 
    productTypes, 
    totalProductTypes, 
    isLoading, 
    fetchProductTypes, 
    deleteProductType 
  } = useProductTypes();
  
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productTypeToDelete, setProductTypeToDelete] = useState<ProductType | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: string | boolean; label: string }>>({});
  const [dropdownOpenStates, setDropdownOpenStates] = useState<Record<string, boolean>>({});

  // Define filter fields for product types
  const filterFields: FilterField[] = [
    {
      id: 'name',
      label: 'Name',
      type: 'text'
    },
    {
      id: 'description',
      label: 'Description',
      type: 'text'
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' }
      ]
    }
  ];

  // Define columns for the data table
  const columns = [
    {
      id: 'name',
      header: 'Name',
      cell: (productType: ProductType) => (
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600">
            <Tag className="h-4 w-4" />
          </div>
          <div>
            <div className="font-medium">{productType.name}</div>
            {productType.description && (
              <div className="text-sm text-gray-500">{productType.description}</div>
            )}
          </div>
        </div>
      ),
      isSortable: true
    },
    {
      id: 'status',
      header: 'Status',
      cell: (productType: ProductType) => (
        <Badge variant="outline" className={`${
          productType.status === 'active'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        } border-0`}>
          {productType.status}
        </Badge>
      ),
      isSortable: true
    },
    {
      id: 'createdAt',
      header: 'Created',
      cell: (productType: ProductType) => (
        <div className="text-sm text-gray-600">
          {new Date(productType.createdAt).toLocaleDateString()}
        </div>
      ),
      isSortable: true
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (productType: ProductType) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setDropdownOpenStates(prev => ({
                ...prev,
                [productType.id]: !prev[productType.id]
              }))}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/product-types/${productType.id}`)}>
              <Eye className="mr-2 h-4 w-4" /> View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/product-types/${productType.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleDeleteClick(productType)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      isSortable: false
    }
  ];

  // Handle delete click
  const handleDeleteClick = (productType: ProductType) => {
    setProductTypeToDelete(productType);
    setDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (productTypeToDelete) {
      try {
        await deleteProductType(productTypeToDelete.id);
        setDeleteDialogOpen(false);
        setProductTypeToDelete(null);
      } catch (error) {
        console.error('Failed to delete product type:', error);
      }
    }
  };

  // Handle search
  const handleSearch = useCallback((search: string) => {
    setSearchTerm(search);
    setPageIndex(0);
  }, []);

  // Handle filters
  const handleApplyFilters = useCallback((filters: FilterValue[]) => {
    const newActiveFilters: Record<string, { value: string | boolean; label: string }> = {};
    filters.forEach(filter => {
      if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
        newActiveFilters[filter.id] = {
          value: filter.value as string | boolean,
          label: filter.id // You might want to map this to a more user-friendly label
        };
      }
    });
    setActiveFilters(newActiveFilters);
    setPageIndex(0);
  }, []);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setActiveFilters({});
    setSearchTerm('');
    setPageIndex(0);
  }, []);

  // Fetch data based on current filters and pagination
  const fetchData = useCallback(async () => {
    const params = {
      page: pageIndex + 1,
      limit,
      search: searchTerm,
      sortBy: 'name',
      sortOrder: 'asc' as const,
      filters: {
        ...activeFilters,
        // Apply tab filter
        ...(activeTab !== 'all' && { status: activeTab as 'active' | 'inactive' })
      }
    };

    await fetchProductTypes(params);
  }, [pageIndex, limit, searchTerm, activeFilters, activeTab, fetchProductTypes]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPageIndex(0);
  };

  // Get filtered data for tabs
  const getTabCount = (status: string) => {
    if (status === 'all') return totalProductTypes;
    // This would need to be calculated from the actual data
    return productTypes.filter(pt => pt.status === status).length;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Types"
        subtitle="Manage your organization's product types"
        actions={
          <Button onClick={() => navigate('/product-types/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add Product Type
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({getTabCount('all')})</TabsTrigger>
          <TabsTrigger value="active">Active ({getTabCount('active')})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({getTabCount('inactive')})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <DataTable
            columns={columns}
            data={productTypes}
            isLoading={isLoading}
            pagination={{
              pageIndex,
              limit,
              pageCount: Math.ceil(totalProductTypes / limit),
              onPageChange: setPageIndex,
              onPageSizeChange: setLimit,
              total: totalProductTypes
            }}
            filterFields={filterFields}
            onSearch={handleSearch}
            onApplyFilters={handleApplyFilters}
            activeFilters={activeFilters}
          />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Product Type"
        description={`Are you sure you want to delete "${productTypeToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default ProductTypesPage;
