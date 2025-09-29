/**
 * Products module barrel exports
 * Following the TRD.md module structure template
 */

// Pages
export { default as ProductsPage } from './pages/ProductsPage';
export { default as CreateProductPage } from './pages/CreateProductPage';
export { default as EditProductPage } from './pages/EditProductPage';
export { default as ProductDetailPage } from './pages/ProductDetailPage';
export { default as ProductForm } from './pages/ProductForm';

// Routes
export { default as productRoutes } from './routes/productRoutes';

// Services
export { default as productService } from './services/productService';

// Hooks
export { useProducts, useProduct, useProductStats } from './hooks/useProducts';

// Types
export type {
  Product,
  ProductDTO,
  CreateProductDTO,
  UpdateProductDTO,
  ProductFormData,
  ProductFilters,
  ProductSearchParams,
  ProductStats,
} from './types/product.types';

// Constants and utilities
export {
  PRODUCT_TYPES,
  PRODUCT_STATUSES,
  getProductTypeLabel,
  getProductStatusInfo,
  formatPrice,
  calculateFinalPrice,
} from './types/product.types';

// Re-export global product type constants for convenience
export {
  PRODUCT_TYPE_NAMES,
  PRODUCT_TYPE_DESCRIPTIONS,
  PRODUCT_TYPE_OPTIONS,
  getProductTypeDescription,
  getProductTypeOption,
  isValidProductType,
} from '@/shared/constants/product-types';
