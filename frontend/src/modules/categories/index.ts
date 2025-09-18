/**
 * Categories module barrel exports
 * Following the TRD.md module structure template
 */

// Pages - Group by functionality
export { default as CategoriesPage } from './pages/CategoriesPage';
export { default as CreateCategoryPage } from './pages/CreateCategoryPage';
export { default as EditCategoryPage } from './pages/EditCategoryPage';
export { default as CategoryDetailPage } from './pages/CategoryDetailPage';

// Routes - Single export per module
export { default as categoryRoutes } from './routes/categoryRoutes';

// Services - Export all services
export { default as categoryService } from './services/categoryService';

// Types - Group related types
export type {
  Category,
  CategoryDTO,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CategoryFormData,
  CategoryFilters,
  CategorySearchParams,
  CategoryStats,
  CategoryHierarchy,
} from './types/category.types';

// Hooks - Export all custom hooks
export {
  useCategories,
  useCategory,
  useCategoryHierarchy,
  useCategoryStats,
} from './hooks/useCategories';
