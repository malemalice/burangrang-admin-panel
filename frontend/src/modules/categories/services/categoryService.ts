import api from '@/core/lib/api';
import { 
  Category, 
  PaginatedResponse, 
  PaginationParams,
  CategoryDTO,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CategoryHierarchy
} from '../types/category.types';

// Convert CategoryDTO from backend to Category model for frontend
const mapCategoryDtoToCategory = (categoryDto: CategoryDTO): Category => {
  return {
    id: categoryDto.id,
    name: categoryDto.name,
    slug: categoryDto.slug,
    description: categoryDto.description,
    imageUrl: categoryDto.imageUrl,
    parentId: categoryDto.parentId,
    parentName: categoryDto.parent?.name,
    order: categoryDto.order,
    status: categoryDto.isActive ? 'active' : 'inactive',
    childrenCount: categoryDto.children?.length || 0,
    createdAt: categoryDto.createdAt,
    updatedAt: categoryDto.updatedAt
  };
};

// Convert Category from frontend to UpdateCategoryDTO for backend
const mapCategoryToUpdateDto = (category: Partial<Category>): UpdateCategoryDTO => {
  return {
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl: category.imageUrl,
    parentId: category.parentId,
    order: category.order,
    isActive: category.status === 'active'
  };
};

const categoryService = {
  // Get all categories with pagination and filtering
  getCategories: async (params: PaginationParams): Promise<PaginatedResponse<Category>> => {
    try {
      const queryParams = new URLSearchParams({
        page: params.page.toString(),
        limit: params.limit.toString()
      });

      // Add sorting if provided
      if (params.sortBy) {
        queryParams.append('sortBy', params.sortBy);
        queryParams.append('sortOrder', params.sortOrder || 'asc');
      }

      // Add search if provided
      if (params.search) {
        queryParams.append('search', params.search);
      }

      // Add any additional filters
      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }

      const response = await api.get(`/categories?${queryParams.toString()}`);
      return {
        data: response.data.data.map(mapCategoryDtoToCategory),
        meta: response.data.meta
      };
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Get a single category by ID
  getCategoryById: async (id: string): Promise<Category> => {
    try {
      const response = await api.get(`/categories/${id}`);
      return mapCategoryDtoToCategory(response.data);
    } catch (error) {
      console.error(`Error fetching category ${id}:`, error);
      throw error;
    }
  },

  // Get category by slug
  getCategoryBySlug: async (slug: string): Promise<Category | null> => {
    try {
      const response = await api.get(`/categories/slug/${slug}`);
      return mapCategoryDtoToCategory(response.data);
    } catch (error) {
      console.error(`Error fetching category by slug ${slug}:`, error);
      return null;
    }
  },

  // Get categories in hierarchical structure
  getCategoriesHierarchy: async (): Promise<CategoryHierarchy[]> => {
    try {
      const response = await api.get('/categories/hierarchy');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories hierarchy:', error);
      throw error;
    }
  },

  // Create a new category
  createCategory: async (categoryData: CreateCategoryDTO): Promise<Category> => {
    try {
      const response = await api.post('/categories', categoryData);
      return mapCategoryDtoToCategory(response.data);
    } catch (error: any) {
      console.error('Error creating category:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create category';
      throw new Error(errorMessage);
    }
  },

  // Update an existing category
  updateCategory: async (id: string, categoryData: UpdateCategoryDTO): Promise<Category> => {
    try {
      const response = await api.patch(`/categories/${id}`, categoryData);
      return mapCategoryDtoToCategory(response.data);
    } catch (error: any) {
      console.error(`Error updating category ${id}:`, error);
      const errorMessage = error.response?.data?.message || 'Failed to update category';
      throw new Error(errorMessage);
    }
  },

  // Delete a category
  deleteCategory: async (id: string): Promise<void> => {
    try {
      await api.delete(`/categories/${id}`);
    } catch (error: any) {
      console.error(`Error deleting category ${id}:`, error);
      const errorMessage = error.response?.data?.message || 'Failed to delete category';
      throw new Error(errorMessage);
    }
  }
};

export default categoryService;
