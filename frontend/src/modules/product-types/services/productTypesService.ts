import api from '@/core/lib/api';
import { 
  ProductTypeDTO,
  CreateProductTypeDTO,
  UpdateProductTypeDTO,
  PaginatedResponse,
  PaginationParams
} from '../types/product-types.types';

// Product Type interface for frontend
export interface ProductType {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// Convert ProductTypeDTO from backend to ProductType model for frontend
const mapProductTypeDtoToProductType = (productTypeDto: ProductTypeDTO): ProductType => {
  return {
    id: productTypeDto.id,
    name: productTypeDto.name,
    description: productTypeDto.description,
    status: productTypeDto.isActive ? 'active' : 'inactive',
    createdAt: productTypeDto.createdAt,
    updatedAt: productTypeDto.updatedAt
  };
};

// Convert ProductType from frontend to UpdateProductTypeDTO for backend
const mapProductTypeToUpdateDto = (productType: Partial<ProductType>): UpdateProductTypeDTO => {
  return {
    name: productType.name,
    description: productType.description,
    isActive: productType.status === 'active'
  };
};

const productTypesService = {
  // Get all product types with pagination and filtering
  getProductTypes: async (params: PaginationParams): Promise<PaginatedResponse<ProductType>> => {
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

      const response = await api.get(`/product-types?${queryParams.toString()}`);
      return {
        data: response.data.data.map(mapProductTypeDtoToProductType),
        meta: response.data.meta
      };
    } catch (error) {
      console.error('Error fetching product types:', error);
      throw error;
    }
  },

  // Get a single product type by ID
  getProductTypeById: async (id: string): Promise<ProductType> => {
    try {
      const response = await api.get(`/product-types/${id}`);
      return mapProductTypeDtoToProductType(response.data);
    } catch (error) {
      console.error(`Error fetching product type ${id}:`, error);
      throw error;
    }
  },

  // Create a new product type
  createProductType: async (productTypeData: CreateProductTypeDTO): Promise<ProductType> => {
    try {
      const response = await api.post('/product-types', productTypeData);
      return mapProductTypeDtoToProductType(response.data);
    } catch (error: any) {
      console.error('Error creating product type:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create product type';
      throw new Error(errorMessage);
    }
  },

  // Update an existing product type
  updateProductType: async (id: string, productTypeData: UpdateProductTypeDTO): Promise<ProductType> => {
    try {
      const response = await api.patch(`/product-types/${id}`, productTypeData);
      return mapProductTypeDtoToProductType(response.data);
    } catch (error: any) {
      console.error(`Error updating product type ${id}:`, error);
      const errorMessage = error.response?.data?.message || 'Failed to update product type';
      throw new Error(errorMessage);
    }
  },

  // Delete a product type
  deleteProductType: async (id: string): Promise<void> => {
    try {
      await api.delete(`/product-types/${id}`);
    } catch (error: any) {
      console.error(`Error deleting product type ${id}:`, error);
      const errorMessage = error.response?.data?.message || 'Failed to delete product type';
      throw new Error(errorMessage);
    }
  }
};

export default productTypesService;
