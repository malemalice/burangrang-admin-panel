import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, Eye, Folder, MoreHorizontal, Tag } from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';
import { Button, ThemeButton } from '@/core/components/ui/button';
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
import categoryService from '../services/categoryService';
import { Category } from '@/core/lib/types';

const CategoriesPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalCategories, setTotalCategories] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [parentCategories, setParentCategories] = useState<{ id: string; name: string }[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, { value: any; label: string }>>({});
  const [dropdownOpenStates, setDropdownOpenStates] = useState<Record<string, boolean>>({});

  // Define filter fields for categories
  const filterFields: FilterField[] = [
    {
      id: 'name',
      label: 'Name',
      type: 'text'
    },
    {
      id: 'slug',
      label: 'Slug',
      type: 'text'
    },
    {
      id: 'parentId',
      label: 'Parent Category',
      type: 'searchableSelect',
      options: parentCategories.map(category => ({
        label: category.name,
        value: category.id
      }))
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

  // Fetch parent categories for filter options
  useEffect(() => {
    const fetchParentCategories = async () => {
      try {
        const response = await categoryService.getCategories({
          page: 1,
          limit: 100,
          filters: { parentId: null } // Only root categories
        });
        setParentCategories(response.data);
      } catch (error) {
        console.error('Failed to fetch parent categories:', error);
        toast.error('Failed to load parent categories');
      }
    };

    fetchParentCategories();
  }, []);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: pageIndex + 1,
        limit,
        search: searchTerm,
        filters: {
          ...Object.entries(activeFilters).reduce((acc, [key, item]) => {
            // Map status to isActive for backend compatibility
            if (key === 'status') {
              return {
                ...acc,
                isActive: item.value === 'active' ? 'true' : 'false'
              };
            }
            return {
              ...acc,
              [key]: item.value
            };
          }, {}),
          // Handle status filter specifically
          ...(activeFilters.status?.value ? {
            isActive: activeFilters.status.value === 'active' ? 'true' : 'false'
          } : {})
        }
      };

      const response = await categoryService.getCategories(params);
      setCategories(response.data);
      setTotalCategories(response.meta.total);
      
      // Ensure we have data from the correct page
      const actualPage = response.meta.page;
      if (actualPage && actualPage - 1 !== pageIndex) {
        setPageIndex(actualPage - 1);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, limit, searchTerm, activeFilters]);

  // Fetch categories when dependencies change
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleDropdownOpenChange = (id: string, open: boolean) => {
    setDropdownOpenStates(prev => ({
      ...prev,
      [id]: open
    }));
  };

  const handleDeleteClick = (category: Category) => {
    // Close the dropdown menu for this category
    setDropdownOpenStates(prev => ({
      ...prev,
      [category.id]: false
    }));
    
    // Set category to delete and open the dialog
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    setIsLoading(true);
    try {
      await categoryService.deleteCategory(categoryToDelete.id);
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPageIndex(0); // Reset to first page on new search
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPageIndex(0);
    
    // Update filters based on tab
    if (value === 'all') {
      setActiveFilters({});
    } else if (value === 'active') {
      setActiveFilters({
        status: { value: 'active', label: 'Active' }
      });
    } else if (value === 'inactive') {
      setActiveFilters({
        status: { value: 'inactive', label: 'Inactive' }
      });
    } else if (value === 'root') {
      setActiveFilters({
        parentId: { value: null, label: 'Root Categories' }
      });
    }
  };

  const handleApplyFilters = (filters: FilterValue[]) => {
    const newActiveFilters: Record<string, { value: any; label: string }> = {};
    
    filters.forEach(filter => {
      if (filter.id === 'parentId') {
        const parent = parentCategories.find(p => p.id === filter.value);
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: parent?.name || 'Root Categories'
        };
      } else if (filter.id === 'status') {
        newActiveFilters[filter.id] = {
          value: filter.value,
          label: filter.value === 'active' ? 'Active' : 'Inactive'
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

  const columns = [
    {
      id: 'name',
      header: 'Name',
      cell: (category: Category) => (
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600">
            <Tag className="h-4 w-4" />
          </div>
          <div>
            <div className="font-medium">{category.name}</div>
            <div className="text-sm text-gray-500">{category.slug}</div>
          </div>
        </div>
      ),
      isSortable: true
    },
    {
      id: 'parent',
      header: 'Parent',
      cell: (category: Category) => (
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-gray-500" />
          <span>{category.parentName || 'Root'}</span>
        </div>
      ),
      isSortable: true
    },
    {
      id: 'children',
      header: 'Children',
      cell: (category: Category) => (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 border-0">
          {category.childrenCount} subcategories
        </Badge>
      ),
      isSortable: true
    },
    {
      id: 'order',
      header: 'Order',
      cell: (category: Category) => (
        <span className="text-sm text-gray-600">{category.order}</span>
      ),
      isSortable: true
    },
    {
      id: 'status',
      header: 'Status',
      cell: (category: Category) => (
        <Badge
          variant="outline"
          className={`${
            category.status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          } border-0`}
        >
          {category.status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      ),
      isSortable: true
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (category: Category) => (
        <DropdownMenu 
          open={dropdownOpenStates[category.id]} 
          onOpenChange={(open) => handleDropdownOpenChange(category.id, open)}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/categories/${category.id}`)}>
              <Eye className="mr-2 h-4 w-4" /> View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/categories/${category.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDeleteClick(category)}
              className="text-red-600 focus:text-red-600"
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
    <>
      <PageHeader
        title="Categories"
        subtitle="Manage product categories and their hierarchy"
        actions={
          <ThemeButton onClick={() => navigate('/categories/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </ThemeButton>
        }
      >
        <Tabs defaultValue="all" className="w-full" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all">All Categories</TabsTrigger>
            <TabsTrigger value="active" data-testid="tab-active">Active</TabsTrigger>
            <TabsTrigger value="inactive" data-testid="tab-inactive">Inactive</TabsTrigger>
            <TabsTrigger value="root" data-testid="tab-root">Root Categories</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <DataTable
        columns={columns}
        data={categories}
        isLoading={isLoading}
        pagination={{
          pageIndex,
          limit,
          pageCount: Math.ceil(totalCategories / limit),
          onPageChange: setPageIndex,
          onPageSizeChange: setLimit,
          total: totalCategories
        }}
        filterFields={filterFields}
        onSearch={handleSearch}
        onApplyFilters={handleApplyFilters}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Category"
        description={`Are you sure you want to delete "${categoryToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default CategoriesPage;
