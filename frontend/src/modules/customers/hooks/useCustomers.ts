import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import customerService from '../services/customerService';
import { Customer, PaginatedResponse, CustomerSearchParams, CreateCustomerDTO, UpdateCustomerDTO, CustomerStats } from '../types/customer.types';

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ CRITICAL: Memoize all functions that are used in useEffect dependencies
  const fetchCustomers = useCallback(async (params: CustomerSearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<Customer> = await customerService.getCustomers(params);
      setCustomers(response.data);
      setTotalCustomers(response.meta.total);
      setCurrentPage(params.page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customers';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array - function is stable

  // ✅ CRITICAL: Memoize CRUD operations to prevent unnecessary re-renders
  const createCustomer = useCallback(async (customerData: CreateCustomerDTO) => {
    try {
      const newCustomer = await customerService.createCustomer(customerData);
      setCustomers(prev => [newCustomer, ...prev]);
      setTotalCustomers(prev => prev + 1);
      toast.success('Customer created successfully');
      return newCustomer;
    } catch (err) {
      toast.error('Failed to create customer');
      throw err;
    }
  }, []);

  const updateCustomer = useCallback(async (id: string, customerData: UpdateCustomerDTO) => {
    try {
      const updatedCustomer = await customerService.updateCustomer(id, customerData);
      setCustomers(prev => prev.map(item => item.id === id ? updatedCustomer : item));
      toast.success('Customer updated successfully');
      return updatedCustomer;
    } catch (err) {
      toast.error('Failed to update customer');
      throw err;
    }
  }, []);

  const deleteCustomer = useCallback(async (id: string) => {
    try {
      await customerService.deleteCustomer(id);
      setCustomers(prev => prev.filter(item => item.id !== id));
      setTotalCustomers(prev => prev - 1);
      toast.success('Customer deleted successfully');
    } catch (err) {
      toast.error('Failed to delete customer');
      throw err;
    }
  }, []);

  return {
    customers,
    totalCustomers,
    currentPage,
    isLoading,
    error,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
};

export const useCustomer = (id: string | null = null) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ CRITICAL: Memoize fetch function to prevent infinite loops
  const fetchCustomer = useCallback(async (customerId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await customerService.getCustomerById(customerId);
      setCustomer(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customer';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ CRITICAL: Include memoized function in dependency array
  useEffect(() => {
    if (id) {
      fetchCustomer(id);
    }
  }, [id, fetchCustomer]);

  return {
    customer,
    isLoading,
    error,
    fetchCustomer,
    setCustomer,
  };
};

export const useCustomerStats = () => {
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ CRITICAL: Memoize fetch function to prevent infinite loops
  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await customerService.getCustomerStats();
      setStats(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customer statistics';
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
