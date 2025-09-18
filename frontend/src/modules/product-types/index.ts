/**
 * Product Types module barrel exports
 * Following the TRD.md module structure template
 */

// Pages
export { default as ProductTypesPage } from './pages/ProductTypesPage';
export { default as CreateProductTypePage } from './pages/CreateProductTypePage';
export { default as EditProductTypePage } from './pages/EditProductTypePage';
export { default as ProductTypeDetailPage } from './pages/ProductTypeDetailPage';
export { default as ProductTypeForm } from './pages/ProductTypeForm';

// Routes
export { default as productTypesRoutes } from './routes/productTypesRoutes';

// Services
export { default as productTypesService } from './services/productTypesService';

// Types
export type {
  ProductTypeDTO,
  CreateProductTypeDTO,
  UpdateProductTypeDTO,
  ProductTypeFormData,
  ProductTypeFilters,
  ProductTypeSearchParams,
  ProductTypeStats,
  PaginatedResponse,
  PaginationParams,
} from './types/product-types.types';

// Hooks
export { useProductTypes, useProductType, useProductTypeStats } from './hooks/useProductTypes';
