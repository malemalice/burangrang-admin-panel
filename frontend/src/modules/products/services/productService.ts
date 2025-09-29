import api from '@/core/lib/api';
import { 
  Product, 
  PaginatedResponse, 
  PaginationParams,
  ProductDTO,
  CreateProductDTO,
  UpdateProductDTO,
  ProductStats,
  calculateFinalPrice
} from '../types/product.types';

// Convert ProductDTO from backend to Product model for frontend
const mapProductDtoToProduct = (productDto: ProductDTO): Product => {
  return {
    id: productDto.id,
    name: productDto.name,
    slug: productDto.slug,
    description: productDto.description,
    shortDescription: productDto.shortDescription,
    price: Number(productDto.price),
    salePrice: productDto.salePrice ? Number(productDto.salePrice) : undefined,
    sku: productDto.sku,
    productType: productDto.productType,
    status: productDto.status,
    stockQuantity: Number(productDto.stockQuantity),
    downloadLimit: productDto.downloadLimit ? Number(productDto.downloadLimit) : undefined,
    viewCount: Number(productDto.viewCount),
    rating: Number(productDto.rating) || 0, // Ensure rating is always a number
    reviewCount: Number(productDto.reviewCount),
    thumbnailUrl: productDto.thumbnailUrl,
    fileUrl: productDto.fileUrl,
    createdBy: productDto.createdBy,
    isActive: productDto.isActive,
    createdAt: productDto.createdAt,
    updatedAt: productDto.updatedAt,
    // Transformed fields
    creator: productDto.createdByUser 
      ? `${productDto.createdByUser.firstName} ${productDto.createdByUser.lastName}`
      : 'Unknown',
    categoryNames: productDto.categories?.map(c => c.category.name) || [],
    categoryIds: productDto.categories?.map(c => c.categoryId) || [],
    fileCount: productDto.files?.length || 0,
    hasCourse: !!productDto.course,
    finalPrice: calculateFinalPrice(Number(productDto.price), productDto.salePrice ? Number(productDto.salePrice) : undefined),
    isOnSale: !!(productDto.salePrice && Number(productDto.salePrice) > 0),
  };
};

// Convert Product from frontend to CreateProductDTO for backend
const mapProductToCreateDto = (product: Partial<Product>): CreateProductDTO => {
  return {
    name: product.name || '',
    slug: product.slug || '',
    description: product.description,
    shortDescription: product.shortDescription,
    price: product.price || 0,
    salePrice: product.salePrice,
    sku: product.sku || '',
    productType: product.productType || 'EBOOK',
    status: product.status || 'DRAFT',
    stockQuantity: product.stockQuantity || 0,
    downloadLimit: product.downloadLimit,
    thumbnailUrl: product.thumbnailUrl,
    fileUrl: product.fileUrl,
    isActive: product.isActive ?? true,
    categoryIds: product.categoryIds,
    courseId: product.course?.id,
  };
};

// Convert Product from frontend to UpdateProductDTO for backend
const mapProductToUpdateDto = (product: Partial<Product>): UpdateProductDTO => {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    price: product.price,
    salePrice: product.salePrice,
    sku: product.sku,
    productType: product.productType,
    status: product.status,
    stockQuantity: product.stockQuantity,
    downloadLimit: product.downloadLimit,
    thumbnailUrl: product.thumbnailUrl,
    fileUrl: product.fileUrl,
    isActive: product.isActive,
    categoryIds: product.categoryIds,
    courseId: product.course?.id,
  };
};

const productService = {
  // Get all products with pagination and filtering
  getProducts: async (params: PaginationParams): Promise<PaginatedResponse<Product>> => {
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
            if (key === 'priceRange' && typeof value === 'object' && value !== null) {
              const priceRange = value as { min?: number; max?: number };
              if (priceRange.min !== undefined) {
                queryParams.append('minPrice', priceRange.min.toString());
              }
              if (priceRange.max !== undefined) {
                queryParams.append('maxPrice', priceRange.max.toString());
              }
            } else if (key === 'productType' && value !== 'all') {
              queryParams.append('productType', value.toString());
            } else if (key === 'status' && value !== 'all') {
              queryParams.append('status', value.toString());
            } else if (key === 'isActive') {
              if (value === 'active') {
                queryParams.append('isActive', 'true');
              } else if (value === 'inactive') {
                queryParams.append('isActive', 'false');
              }
            } else if (key !== 'priceRange' && key !== 'productType' && key !== 'status' && key !== 'isActive') {
              queryParams.append(key, value.toString());
            }
          }
        });
      }

      const response = await api.get(`/products?${queryParams.toString()}`);
      return {
        data: response.data.data.map(mapProductDtoToProduct),
        meta: response.data.meta
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // Get a single product by ID
  getProductById: async (id: string): Promise<Product> => {
    try {
      const response = await api.get(`/products/${id}`);
      return mapProductDtoToProduct(response.data);
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw error;
    }
  },

  // Create a new product
  createProduct: async (productData: CreateProductDTO): Promise<Product> => {
    try {
      const response = await api.post('/products', productData);
      return mapProductDtoToProduct(response.data);
    } catch (error: any) {
      console.error('Error creating product:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create product';
      throw new Error(errorMessage);
    }
  },

  // Update an existing product
  updateProduct: async (id: string, productData: UpdateProductDTO): Promise<Product> => {
    try {
      const response = await api.patch(`/products/${id}`, productData);
      return mapProductDtoToProduct(response.data);
    } catch (error: any) {
      console.error(`Error updating product ${id}:`, error);
      const errorMessage = error.response?.data?.message || 'Failed to update product';
      throw new Error(errorMessage);
    }
  },

  // Delete a product
  deleteProduct: async (id: string): Promise<void> => {
    try {
      await api.delete(`/products/${id}`);
    } catch (error: any) {
      console.error(`Error deleting product ${id}:`, error);
      const errorMessage = error.response?.data?.message || 'Failed to delete product';
      throw new Error(errorMessage);
    }
  },

  // Get product statistics
  getProductStats: async (): Promise<ProductStats> => {
    try {
      const response = await api.get('/products/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching product stats:', error);
      throw error;
    }
  },

  // Increment product view count
  incrementViewCount: async (id: string): Promise<void> => {
    try {
      await api.post(`/products/${id}/view`);
    } catch (error) {
      console.error(`Error incrementing view count for product ${id}:`, error);
      // Don't throw error for view count increment failures
    }
  },

  // Helper function to generate slug from name
  generateSlug: (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();
  },

  // Helper function to validate SKU format
  validateSku: (sku: string): boolean => {
    // SKU should be 3-20 characters, alphanumeric with hyphens and underscores
    const skuRegex = /^[A-Z0-9][A-Z0-9-_]{2,19}$/;
    return skuRegex.test(sku);
  },
};

export default productService;
