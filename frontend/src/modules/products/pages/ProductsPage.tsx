import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, Eye, Package, DollarSign, Star, MoreHorizontal, Tag, Users } from 'lucide-react';
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
import { useProducts } from '../hooks/useProducts';
import { categoryService } from '@/modules/categories';
import { Product, ProductFilters, getProductStatusInfo, getProductTypeLabel, formatPrice, formatPriceDisplay } from '../types/product.types';
import { PRODUCT_TYPE_OPTIONS } from '@/shared/constants/product-types';

const ProductsPage = () => {
  const navigate = useNavigate();
  const {
    products,
    totalProducts,
    currentPage,
    isLoading,
    error,
    fetchProducts,
    deleteProduct,
    incrementViewCount,
  } = useProducts();

  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [dropdownOpenStates, setDropdownOpenStates] = useState<Record<string, boolean>>({});

  // Define filter fields for products
  const filterFields: FilterField[] = [
    {
      id: 'name',
      label: 'Name',
      type: 'text'
    },
    {
      id: 'sku',
      label: 'SKU',
      type: 'text'
    },
    {
      id: 'productType',
      label: 'Product Type',
      type: 'select',
      options: [
        { label: 'All Types', value: 'all' },
        ...PRODUCT_TYPE_OPTIONS.map(option => ({
          label: option.label,
          value: option.value
        }))
      ]
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: 'all' },
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Review', value: 'REVIEW' },
        { label: 'Approved', value: 'APPROVED' },
        { label: 'Published', value: 'PUBLISHED' },
        { label: 'Archived', value: 'ARCHIVED' },
      ]
    },
    {
      id: 'categoryId',
      label: 'Category',
      type: 'searchableSelect',
      options: categories.map(category => ({
        label: category.name,
        value: category.id
      }))
    },
    {
      id: 'isActive',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All', value: 'all' },
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' }
      ]
    },
    {
      id: 'priceRange',
      label: 'Price Range',
      type: 'range',
      min: 0,
      max: 1000,
      step: 10
    }
  ];

  // Fetch categories for filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const categoriesResponse = await categoryService.getCategories({ page: 1, limit: 100 });
        setCategories(categoriesResponse.data);
      } catch (error) {
        console.error('Failed to fetch filter options:', error);
        toast.error('Failed to load filter options');
      }
    };

    fetchFilterOptions();
  }, []);

  // Fetch products data when filters, search, or pagination changes
  useEffect(() => {
    const fetchProductsData = async () => {
      try {
        const filters: ProductFilters = {
          ...Object.entries(activeFilters).reduce((acc, [key, item]) => {
            if (key === 'priceRange' && typeof item.value === 'object') {
              return {
                ...acc,
                priceRange: item.value
              };
            }
            return {
              ...acc,
              [key]: item.value === 'all' ? undefined : item.value
            };
          }, {}),
        };

        await fetchProducts({
          page: pageIndex + 1,
          limit,
          search: searchTerm,
          filters,
        });
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
    };

    fetchProductsData();
  }, [pageIndex, limit, searchTerm, activeFilters, fetchProducts]);

  const handleDelete = async () => {
    if (!productToDelete) return;

    try {
      await deleteProduct(productToDelete.id);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const handleViewProduct = (product: Product) => {
    incrementViewCount(product.id);
    navigate(`/products/${product.id}`);
  };

  const handleEditProduct = (product: Product) => {
    navigate(`/products/${product.id}/edit`);
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    const newActiveFilters: Record<string, { value: any; label: string }> = {};
    
    filters.forEach(filter => {
      if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: filter.label || String(filter.value)
        };
      }
    });

    setActiveFilters(newActiveFilters);
    setPageIndex(0); // Reset to first page when filters change
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setPageIndex(0); // Reset to first page when search changes
  };

  // Define columns for the data table
  const columns = [
    {
      id: 'product',
      header: 'Product',
      cell: (product: Product) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
            {product.thumbnailUrl ? (
              <img
                src={product.thumbnailUrl}
                alt={product.name}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <Package className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <div>
            <div className="font-medium">{product.name}</div>
            <div className="text-sm text-gray-500">{product.sku}</div>
          </div>
        </div>
      ),
      isSortable: true
    },
    {
      id: 'type',
      header: 'Type',
      cell: (product: Product) => (
        <Badge variant="outline" className="capitalize">
          {getProductTypeLabel(product.productType)}
        </Badge>
      ),
      isSortable: true
    },
    {
      id: 'status',
      header: 'Status',
      cell: (product: Product) => {
        const statusInfo = getProductStatusInfo(product.status);
        return (
          <Badge 
            variant="outline" 
            className={`capitalize ${
              statusInfo.color === 'green' ? 'bg-green-100 text-green-800' :
              statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
              statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
              statusInfo.color === 'red' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            } border-0`}
          >
            {statusInfo.label}
          </Badge>
        );
      },
      isSortable: true
    },
    {
      id: 'price',
      header: 'Price',
      cell: (product: Product) => (
        <div className="text-right">
          {product.isFreePrice ? (
            <div>
              <div className="font-medium text-blue-600">Self Price</div>
              {product.minFreePrice && (
                <div className="text-xs text-gray-500">
                  Min: {formatPriceDisplay(product.minFreePrice)}
                </div>
              )}
              {product.maxFreePrice && (
                <div className="text-xs text-gray-500">
                  Max: {formatPriceDisplay(product.maxFreePrice)}
                </div>
              )}
            </div>
          ) : product.isOnSale ? (
            <div>
              <div className="text-sm text-gray-500 line-through">
                {formatPriceDisplay(product.price)}
              </div>
              <div className="font-medium text-green-600">
                {formatPriceDisplay(product.salePrice!)}
              </div>
            </div>
          ) : (
            <div className="font-medium">{formatPriceDisplay(product.price)}</div>
          )}
        </div>
      ),
      isSortable: true
    },
    {
      id: 'metrics',
      header: 'Metrics',
      cell: (product: Product) => (
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4 text-gray-400" />
            {product.viewCount}
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-gray-400" />
            {(typeof product.rating === 'number' ? product.rating : 0).toFixed(1)}
          </div>
        </div>
      ),
      isSortable: false
    },
    {
      id: 'active',
      header: 'Active',
      cell: (product: Product) => (
        <Badge variant="outline" className={`${
          product.isActive
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        } border-0`}>
          {product.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
      isSortable: true
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (product: Product) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewProduct(product)}>
              <Eye className="mr-2 h-4 w-4" /> View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditProduct(product)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleDeleteClick(product)}
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

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Manage your digital products catalog"
        actions={
          <Button onClick={() => navigate('/products/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="all">All Products ({totalProducts})</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="on-sale">On Sale</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <DataTable
            columns={columns}
            data={products}
            isLoading={isLoading}
            pagination={{
              pageIndex,
              limit,
              pageCount: Math.ceil(totalProducts / limit),
              onPageChange: setPageIndex,
              onPageSizeChange: setLimit,
              total: totalProducts
            }}
            filterFields={filterFields}
            onSearch={handleSearch}
            onApplyFilters={handleApplyFilters}
          />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Product"
        description={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default ProductsPage;
