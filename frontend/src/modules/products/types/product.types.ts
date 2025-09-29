/**
 * Products module types
 */

// Re-export core types that are used by products module
export type { PaginatedResponse, PaginationParams } from '@/core/lib/types';

import { ProductTypeName, PRODUCT_TYPE_OPTIONS } from '@/shared/constants/product-types';

// Interface for product data from API that matches backend structure
export interface ProductDTO {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: number;
  salePrice?: number;
  sku: string;
  productType: ProductTypeName; // ✅ Use global constant type
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
  stockQuantity: number;
  downloadLimit?: number;
  viewCount: number;
  rating: number;
  reviewCount: number;
  thumbnailUrl?: string;
  fileUrl?: string; // URL to uploaded file (PDF, etc.)
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  categories?: Array<{
    id: string;
    categoryId: string;
    category: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  files?: Array<{
    id: string;
    fileName: string;
    originalName: string;
    fileType: string;
    fileSize: number;
    mimeType: string;
  }>;
  course?: {
    id: string;
    title: string;
    slug: string;
    description?: string;
    totalChapters: number;
    totalDuration: number;
    difficulty: string;
    language: string;
    rating: number;
    studentCount: number;
    status: string;
    isPublished: boolean;
  };
}

// Frontend Product model
export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: number;
  salePrice?: number;
  sku: string;
  productType: ProductTypeName; // ✅ Use global constant type
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
  stockQuantity: number;
  downloadLimit?: number;
  viewCount: number;
  rating: number;
  reviewCount: number;
  thumbnailUrl?: string;
  fileUrl?: string; // URL to uploaded file (PDF, etc.)
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Transformed fields
  creator?: string;
  categoryNames?: string[];
  categoryIds?: string[];
  fileCount?: number;
  hasCourse?: boolean;
  finalPrice?: number;
  isOnSale?: boolean;
  course?: {
    id: string;
    title: string;
    slug: string;
    description?: string;
    totalChapters: number;
    totalDuration: number;
    difficulty: string;
    language: string;
    rating: number;
    studentCount: number;
    status: string;
    isPublished: boolean;
  };
  files?: Array<{ // Added files property
    id: string;
    fileName: string;
    originalName: string;
    fileType: string;
    fileSize: number;
    mimeType: string;
  }>;
}

// Interface for creating a product
export interface CreateProductDTO {
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: number;
  salePrice?: number;
  sku: string;
  productType: ProductTypeName; // ✅ Use global constant type
  status?: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
  stockQuantity: number;
  downloadLimit?: number;
  thumbnailUrl?: string;
  fileUrl?: string; // URL to uploaded file (PDF, etc.)
  isActive?: boolean;
  categoryIds?: string[];
  courseId?: string; // Course association for COURSE products
}

// Interface for updating a product
export interface UpdateProductDTO {
  name?: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  price?: number;
  salePrice?: number;
  sku?: string;
  productType?: ProductTypeName; // ✅ Use global constant type
  status?: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
  stockQuantity?: number;
  downloadLimit?: number;
  thumbnailUrl?: string;
  fileUrl?: string; // URL to uploaded file (PDF, etc.)
  isActive?: boolean;
  categoryIds?: string[];
  courseId?: string; // Course association for COURSE products
}

// Product form data for frontend forms
export interface ProductFormData {
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: number;
  salePrice?: number;
  sku: string;
  productType: ProductTypeName; // ✅ Use global constant type
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
  stockQuantity: number;
  downloadLimit?: number;
  thumbnailUrl?: string;
  fileUrl?: string; // URL to uploaded file (PDF, etc.)
  isActive: boolean;
  categoryIds: string[];
  courseId?: string; // Course association for COURSE products
}

// Product filter options
export interface ProductFilters {
  name?: string;
  sku?: string;
  productType?: ProductTypeName | 'all'; // ✅ Use global constant type
  status?: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED' | 'all';
  category?: string;
  creator?: string;
  isActive?: 'active' | 'inactive' | 'all';
  priceRange?: {
    min?: number;
    max?: number;
  };
  onSale?: boolean;
  createdAfter?: string;
  createdBefore?: string;
}

// Product search parameters
export interface ProductSearchParams extends PaginationParams {
  filters?: ProductFilters;
}

// Product statistics for dashboard/reporting
export interface ProductStats {
  total: number;
  active: number;
  byType: Array<{
    type: string;
    count: number;
  }>;
  byStatus: Array<{
    status: string;
    count: number;
  }>;
  totalViews: number;
  averageRating: number;
}

// ✅ Import global constants instead of hardcoded values
export { PRODUCT_TYPE_OPTIONS as PRODUCT_TYPES } from '@/shared/constants/product-types';

// Product status options for forms
export const PRODUCT_STATUSES = [
  { value: 'DRAFT', label: 'Draft', color: 'gray' },
  { value: 'REVIEW', label: 'Review', color: 'yellow' },
  { value: 'APPROVED', label: 'Approved', color: 'blue' },
  { value: 'PUBLISHED', label: 'Published', color: 'green' },
  { value: 'ARCHIVED', label: 'Archived', color: 'red' },
] as const;

// Helper function to get product type label
export const getProductTypeLabel = (type: string): string => {
  const productType = PRODUCT_TYPE_OPTIONS.find(pt => pt.value === type);
  return productType?.label || type;
};

// Helper function to get product status label and color
export const getProductStatusInfo = (status: string) => {
  const statusInfo = PRODUCT_STATUSES.find(ps => ps.value === status);
  return {
    label: statusInfo?.label || status,
    color: statusInfo?.color || 'gray',
  };
};

// Helper function to format price
export const formatPrice = (price: number | string, currency = 'USD'): string => {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numericPrice)) {
    return '$0.00';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(numericPrice);
};

// Helper function to calculate final price (considering sale price)
export const calculateFinalPrice = (price: number | string, salePrice?: number | string): number => {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  const numericSalePrice = typeof salePrice === 'string' ? parseFloat(salePrice) : salePrice;
  
  if (isNaN(numericPrice)) {
    return 0;
  }
  
  return numericSalePrice && !isNaN(numericSalePrice) && numericSalePrice > 0 ? numericSalePrice : numericPrice;
};
