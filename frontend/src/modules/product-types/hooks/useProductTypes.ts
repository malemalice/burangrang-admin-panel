import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import productTypesService, { ProductType } from '../services/productTypesService';
import { 
  PaginatedResponse, 
  ProductTypeSearchParams,
  CreateProductTypeDTO,
  UpdateProductTypeDTO,
  ProductTypeStats 
} from '../types/product-types.types';

/**
 * Custom hook for managing product types
 */
export const useProductTypes = () => {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [totalProductTypes, setTotalProductTypes] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch product types with pagination and filters
  const fetchProductTypes = useCallback(async (params: ProductTypeSearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<ProductType> = await productTypesService.getProductTypes(params);
      setProductTypes(response.data);
      setTotalProductTypes(response.meta.total);
      setCurrentPage(params.page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch product types';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new product type
  const createProductType = useCallback(async (productTypeData: CreateProductTypeDTO) => {
    try {
      const newProductType = await productTypesService.createProductType(productTypeData);
      setProductTypes(prev => [newProductType, ...prev]);
      setTotalProductTypes(prev => prev + 1);
      toast.success('Product type created successfully');
      return newProductType;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create product type';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Update an existing product type
  const updateProductType = useCallback(async (id: string, productTypeData: UpdateProductTypeDTO) => {
    try {
      const updatedProductType = await productTypesService.updateProductType(id, productTypeData);
      setProductTypes(prev => prev.map(productType => productType.id === id ? updatedProductType : productType));
      toast.success('Product type updated successfully');
      return updatedProductType;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update product type';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Delete a product type
  const deleteProductType = useCallback(async (id: string) => {
    try {
      await productTypesService.deleteProductType(id);
      setProductTypes(prev => prev.filter(productType => productType.id !== id));
      setTotalProductTypes(prev => prev - 1);
      toast.success('Product type deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete product type';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  return {
    productTypes,
    totalProductTypes,
    currentPage,
    isLoading,
    error,
    fetchProductTypes,
    createProductType,
    updateProductType,
    deleteProductType,
  };
};

/**
 * Custom hook for managing a single product type
 */
export const useProductType = (productTypeId: string | null = null) => {
  const [productType, setProductType] = useState<ProductType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch a single product type by ID
  const fetchProductType = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const productTypeData = await productTypesService.getProductTypeById(id);
      setProductType(productTypeData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch product type';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load product type on mount if productTypeId is provided
  useEffect(() => {
    if (productTypeId) {
      fetchProductType(productTypeId);
    }
  }, [productTypeId]);

  return {
    productType,
    isLoading,
    error,
    fetchProductType,
    setProductType,
  };
};

/**
 * Custom hook for product type statistics
 */
export const useProductTypeStats = () => {
  const [stats, setStats] = useState<ProductTypeStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // This would need to be implemented in the productTypesService
      // const productTypeStats = await productTypesService.getProductTypeStats();
      // setStats(productTypeStats);
      
      // For now, return mock data structure
      const mockStats: ProductTypeStats = {
        total: 0,
        active: 0,
        inactive: 0,
        recentlyCreated: 0,
      };
      setStats(mockStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch product type statistics';
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
