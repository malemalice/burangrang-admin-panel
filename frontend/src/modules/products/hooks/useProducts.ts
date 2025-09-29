import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import productService from '../services/productService';
import { 
  Product, 
  PaginatedResponse, 
  ProductSearchParams,
  CreateProductDTO,
  UpdateProductDTO,
  ProductStats 
} from '../types/product.types';

/**
 * Custom hook for managing products
 */
export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch products with pagination and filters
  const fetchProducts = useCallback(async (params: ProductSearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<Product> = await productService.getProducts(params);
      setProducts(response.data);
      setTotalProducts(response.meta.total);
      setCurrentPage(params.page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new product
  const createProduct = async (productData: CreateProductDTO) => {
    try {
      const newProduct = await productService.createProduct(productData);
      setProducts(prev => [newProduct, ...prev]);
      setTotalProducts(prev => prev + 1);
      toast.success('Product created successfully');
      return newProduct;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create product';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Update an existing product
  const updateProduct = async (id: string, productData: UpdateProductDTO) => {
    try {
      const updatedProduct = await productService.updateProduct(id, productData);
      setProducts(prev => prev.map(item => item.id === id ? updatedProduct : item));
      toast.success('Product updated successfully');
      return updatedProduct;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update product';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Delete a product
  const deleteProduct = async (id: string) => {
    try {
      await productService.deleteProduct(id);
      setProducts(prev => prev.filter(item => item.id !== id));
      setTotalProducts(prev => prev - 1);
      toast.success('Product deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete product';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Increment view count
  const incrementViewCount = async (id: string) => {
    try {
      await productService.incrementViewCount(id);
      setProducts(prev => prev.map(item => 
        item.id === id ? { ...item, viewCount: item.viewCount + 1 } : item
      ));
    } catch (err) {
      // Don't show error toast for view count increment failures
      console.error('Failed to increment view count:', err);
    }
  };

  return {
    products,
    totalProducts,
    currentPage,
    isLoading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    incrementViewCount,
  };
};

/**
 * Custom hook for managing a single product
 */
export const useProduct = (id: string | null = null) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async (productId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await productService.getProductById(productId);
      setProduct(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch product';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id, fetchProduct]);

  return {
    product,
    isLoading,
    error,
    fetchProduct,
    setProduct,
  };
};

/**
 * Custom hook for product statistics
 */
export const useProductStats = () => {
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await productService.getProductStats();
      setStats(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch product stats';
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
