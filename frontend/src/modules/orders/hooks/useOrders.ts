/**
 * Orders hooks
 * Following TRD.md patterns for custom hooks with proper memoization
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import ordersService from '../services/ordersService';
import { 
  Order, 
  PaginatedResponse, 
  OrderSearchParams, 
  CreateOrderDTO, 
  UpdateOrderDTO,
  OrderStats
} from '../types/order.types';

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ CRITICAL: Memoize all functions to prevent infinite loops
  const fetchOrders = useCallback(async (params: OrderSearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<Order> = await ordersService.getOrders(params);
      setOrders(response.data || []);
      setTotalOrders(response.meta?.total || 0);
      setCurrentPage(params.page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders';
      setError(errorMessage);
      toast.error(errorMessage);
      // Set empty array on error to prevent undefined issues
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array for stable reference

  const createOrder = useCallback(async (orderData: CreateOrderDTO) => {
    try {
      const newOrder = await ordersService.createOrder(orderData);
      setOrders(prev => [newOrder, ...prev]);
      setTotalOrders(prev => prev + 1);
      toast.success('Order created successfully');
      return newOrder;
    } catch (err) {
      toast.error('Failed to create order');
      throw err;
    }
  }, []);

  const updateOrder = useCallback(async (id: string, orderData: UpdateOrderDTO) => {
    try {
      const updatedOrder = await ordersService.updateOrder(id, orderData);
      setOrders(prev => prev.map(order => order.id === id ? updatedOrder : order));
      toast.success('Order updated successfully');
      return updatedOrder;
    } catch (err) {
      toast.error('Failed to update order');
      throw err;
    }
  }, []);

  const updateOrderStatus = useCallback(async (id: string, status: string) => {
    try {
      const updatedOrder = await ordersService.updateOrderStatus(id, status);
      setOrders(prev => prev.map(order => order.id === id ? updatedOrder : order));
      toast.success('Order status updated successfully');
      return updatedOrder;
    } catch (err) {
      toast.error('Failed to update order status');
      throw err;
    }
  }, []);

  const deleteOrder = useCallback(async (id: string) => {
    try {
      await ordersService.deleteOrder(id);
      setOrders(prev => prev.filter(order => order.id !== id));
      setTotalOrders(prev => prev - 1);
      toast.success('Order deleted successfully');
    } catch (err) {
      toast.error('Failed to delete order');
      throw err;
    }
  }, []);

  return {
    orders,
    totalOrders,
    currentPage,
    isLoading,
    error,
    fetchOrders,
    createOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
  };
};

export const useOrder = (id: string | null = null) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ CRITICAL: Memoize fetch function to prevent infinite loops
  const fetchOrder = useCallback(async (orderId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ordersService.getOrderById(orderId);
      setOrder(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch order';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ CRITICAL: Include memoized function in dependency array
  useEffect(() => {
    if (id) {
      fetchOrder(id);
    }
  }, [id, fetchOrder]);

  return {
    order,
    isLoading,
    error,
    fetchOrder,
    setOrder,
  };
};

export const useOrderStats = () => {
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ CRITICAL: Memoize fetch function
  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ordersService.getOrderStats();
      setStats(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch order statistics';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ CRITICAL: Include memoized function in dependency array
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    fetchStats,
  };
};
