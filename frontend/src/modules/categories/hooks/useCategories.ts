import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import categoryService from '../services/categoryService';
import { 
  Category, 
  PaginatedResponse, 
  CategorySearchParams,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CategoryStats,
  CategoryHierarchy
} from '../types/category.types';

/**
 * Custom hook for managing categories
 */
export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalCategories, setTotalCategories] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories with pagination and filters
  const fetchCategories = async (params: CategorySearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<Category> = await categoryService.getCategories(params);
      setCategories(response.data);
      setTotalCategories(response.meta.total);
      setCurrentPage(params.page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch categories';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new category
  const createCategory = async (categoryData: CreateCategoryDTO) => {
    try {
      const newCategory = await categoryService.createCategory(categoryData);
      setCategories(prev => [newCategory, ...prev]);
      setTotalCategories(prev => prev + 1);
      toast.success('Category created successfully');
      return newCategory;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create category';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Update an existing category
  const updateCategory = async (id: string, categoryData: UpdateCategoryDTO) => {
    try {
      const updatedCategory = await categoryService.updateCategory(id, categoryData);
      setCategories(prev => prev.map(category => category.id === id ? updatedCategory : category));
      toast.success('Category updated successfully');
      return updatedCategory;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update category';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Delete a category
  const deleteCategory = async (id: string) => {
    try {
      await categoryService.deleteCategory(id);
      setCategories(prev => prev.filter(category => category.id !== id));
      setTotalCategories(prev => prev - 1);
      toast.success('Category deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete category';
      toast.error(errorMessage);
      throw err;
    }
  };

  return {
    categories,
    totalCategories,
    currentPage,
    isLoading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};

/**
 * Custom hook for managing a single category
 */
export const useCategory = (categoryId: string | null = null) => {
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch a single category by ID
  const fetchCategory = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const categoryData = await categoryService.getCategoryById(id);
      setCategory(categoryData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch category';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Load category on mount if categoryId is provided
  useEffect(() => {
    if (categoryId) {
      fetchCategory(categoryId);
    }
  }, [categoryId]);

  return {
    category,
    isLoading,
    error,
    fetchCategory,
    setCategory,
  };
};

/**
 * Custom hook for category hierarchy
 */
export const useCategoryHierarchy = () => {
  const [hierarchy, setHierarchy] = useState<CategoryHierarchy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHierarchy = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const hierarchyData = await categoryService.getCategoriesHierarchy();
      setHierarchy(hierarchyData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch category hierarchy';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchy();
  }, []);

  return {
    hierarchy,
    isLoading,
    error,
    fetchHierarchy,
  };
};

/**
 * Custom hook for category statistics
 */
export const useCategoryStats = () => {
  const [stats, setStats] = useState<CategoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // This would need to be implemented in the categoryService
      // const categoryStats = await categoryService.getCategoryStats();
      // setStats(categoryStats);
      
      // For now, return mock data structure
      const mockStats: CategoryStats = {
        total: 0,
        active: 0,
        inactive: 0,
        rootCategories: 0,
        subCategories: 0,
        byLevel: [],
        recentCreated: 0,
        recentUpdated: 0,
      };
      setStats(mockStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch category statistics';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    isLoading,
    error,
    fetchStats,
  };
};
