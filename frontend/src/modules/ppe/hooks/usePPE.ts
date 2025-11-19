/**
 * PPE hooks
 * Following TRD.md patterns for custom hooks
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import ppeService from '../services/ppeService';
import {
    PPEStock,
    PPEStockItem,
    PPEWithdrawal,
    PaginatedResponse,
    PPEStockSearchParams,
    PPEStockItemSearchParams,
    PPEWithdrawalSearchParams,
    CreatePPEStockDTO,
    UpdatePPEStockDTO,
    CreatePPEWithdrawalDTO,
    UpdatePPEWithdrawalDTO,
    CreateStockAdjustmentDTO,
} from '../types/ppe.types';

// =============================================================================
// STOCK HOOKS
// =============================================================================

export const usePPEStocks = () => {
    const [stocks, setStocks] = useState<PPEStock[]>([]);
    const [totalStocks, setTotalStocks] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStocks = useCallback(async (params: PPEStockSearchParams) => {
        setIsLoading(true);
        setError(null);
        try {
            const response: PaginatedResponse<PPEStock> = await ppeService.getStocks(params);
            setStocks(response.data || []);
            setTotalStocks(response.meta?.total || 0);
            setCurrentPage(params.page);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stocks';
            setError(errorMessage);
            toast.error(errorMessage);
            setStocks([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createStock = async (stockData: CreatePPEStockDTO) => {
        try {
            const newStock = await ppeService.createStock(stockData);
            setStocks((prev) => [newStock, ...prev]);
            setTotalStocks((prev) => prev + 1);
            toast.success('Stock created successfully');
            return newStock;
        } catch (err) {
            toast.error('Failed to create stock');
            throw err;
        }
    };

    const updateStock = async (id: string, stockData: UpdatePPEStockDTO) => {
        try {
            const updatedStock = await ppeService.updateStock(id, stockData);
            setStocks((prev) => prev.map((item) => (item.id === id ? updatedStock : item)));
            toast.success('Stock updated successfully');
            return updatedStock;
        } catch (err) {
            toast.error('Failed to update stock');
            throw err;
        }
    };

    return {
        stocks,
        totalStocks,
        currentPage,
        isLoading,
        error,
        fetchStocks,
        createStock,
        updateStock,
    };
};

export const usePPEStock = (id: string | null = null) => {
    const [stock, setStock] = useState<PPEStock | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStock = useCallback(async (stockId: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await ppeService.getStockById(stockId);
            setStock(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stock';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (id) {
            fetchStock(id);
        }
    }, [id, fetchStock]);

    const updateStockItem = async (
        stockId: string,
        itemId: string,
        updateData: Partial<{
            currentQuantity: number;
            reservedQuantity: number;
            status: string;
            expiryDate: string;
        }>,
    ) => {
        try {
            const updatedItem = await ppeService.updateStockItem(stockId, itemId, updateData);
            if (stock) {
                setStock({
                    ...stock,
                    items: stock.items?.map((item) => (item.id === itemId ? updatedItem : item)),
                });
            }
            toast.success('Stock item updated successfully');
            return updatedItem;
        } catch (err) {
            toast.error('Failed to update stock item');
            throw err;
        }
    };

    const adjustStockItem = async (
        stockId: string,
        itemId: string,
        adjustmentData: CreateStockAdjustmentDTO,
    ) => {
        try {
            await ppeService.adjustStockItem(stockId, itemId, adjustmentData);
            // Refresh stock data
            if (id) {
                await fetchStock(id);
            }
            toast.success('Stock adjustment created successfully');
        } catch (err) {
            toast.error('Failed to create stock adjustment');
            throw err;
        }
    };

    return {
        stock,
        isLoading,
        error,
        fetchStock,
        setStock,
        updateStockItem,
        adjustStockItem,
    };
};

export const usePPEStockItems = () => {
    const [stockItems, setStockItems] = useState<PPEStockItem[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStockItems = useCallback(async (params: PPEStockItemSearchParams) => {
        setIsLoading(true);
        setError(null);
        try {
            const response: PaginatedResponse<PPEStockItem> = await ppeService.getAvailableStockItems(params);
            setStockItems(response.data || []);
            setTotalItems(response.meta?.total || 0);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stock items';
            setError(errorMessage);
            toast.error(errorMessage);
            setStockItems([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        stockItems,
        totalItems,
        isLoading,
        error,
        fetchStockItems,
    };
};

// =============================================================================
// WITHDRAWAL HOOKS
// =============================================================================

export const usePPEWithdrawals = () => {
    const [withdrawals, setWithdrawals] = useState<PPEWithdrawal[]>([]);
    const [totalWithdrawals, setTotalWithdrawals] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchWithdrawals = useCallback(async (params: PPEWithdrawalSearchParams) => {
        setIsLoading(true);
        setError(null);
        try {
            const response: PaginatedResponse<PPEWithdrawal> = await ppeService.getWithdrawals(params);
            setWithdrawals(response.data || []);
            setTotalWithdrawals(response.meta?.total || 0);
            setCurrentPage(params.page);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch withdrawals';
            setError(errorMessage);
            toast.error(errorMessage);
            setWithdrawals([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createWithdrawal = async (withdrawalData: CreatePPEWithdrawalDTO) => {
        try {
            const newWithdrawal = await ppeService.createWithdrawal(withdrawalData);
            setWithdrawals((prev) => [newWithdrawal, ...prev]);
            setTotalWithdrawals((prev) => prev + 1);
            toast.success('Withdrawal created successfully');
            return newWithdrawal;
        } catch (err) {
            toast.error('Failed to create withdrawal');
            throw err;
        }
    };

    const approveWithdrawal = async (id: string, updateData: UpdatePPEWithdrawalDTO) => {
        try {
            const updatedWithdrawal = await ppeService.approveWithdrawal(id, updateData);
            setWithdrawals((prev) => prev.map((item) => (item.id === id ? updatedWithdrawal : item)));
            toast.success('Withdrawal approved successfully');
            return updatedWithdrawal;
        } catch (err) {
            toast.error('Failed to approve withdrawal');
            throw err;
        }
    };

    const collectWithdrawal = async (id: string, updateData: UpdatePPEWithdrawalDTO) => {
        try {
            const updatedWithdrawal = await ppeService.collectWithdrawal(id, updateData);
            setWithdrawals((prev) => prev.map((item) => (item.id === id ? updatedWithdrawal : item)));
            toast.success('Withdrawal collected successfully');
            return updatedWithdrawal;
        } catch (err) {
            toast.error('Failed to collect withdrawal');
            throw err;
        }
    };

    const cancelWithdrawal = async (id: string, updateData?: UpdatePPEWithdrawalDTO) => {
        try {
            const updatedWithdrawal = await ppeService.cancelWithdrawal(id, updateData);
            setWithdrawals((prev) => prev.map((item) => (item.id === id ? updatedWithdrawal : item)));
            toast.success('Withdrawal cancelled successfully');
            return updatedWithdrawal;
        } catch (err) {
            toast.error('Failed to cancel withdrawal');
            throw err;
        }
    };

    return {
        withdrawals,
        totalWithdrawals,
        currentPage,
        isLoading,
        error,
        fetchWithdrawals,
        createWithdrawal,
        approveWithdrawal,
        collectWithdrawal,
        cancelWithdrawal,
    };
};

export const usePPEWithdrawal = (id: string | null = null) => {
    const [withdrawal, setWithdrawal] = useState<PPEWithdrawal | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchWithdrawal = useCallback(async (withdrawalId: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await ppeService.getWithdrawalById(withdrawalId);
            setWithdrawal(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch withdrawal';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const approveWithdrawal = useCallback(async (withdrawalId: string, updateData: UpdatePPEWithdrawalDTO) => {
        try {
            const updatedWithdrawal = await ppeService.approveWithdrawal(withdrawalId, updateData);
            setWithdrawal(updatedWithdrawal);
            toast.success('Withdrawal approved successfully');
            return updatedWithdrawal;
        } catch (err) {
            toast.error('Failed to approve withdrawal');
            throw err;
        }
    }, []);

    const collectWithdrawal = useCallback(async (withdrawalId: string, updateData: UpdatePPEWithdrawalDTO) => {
        try {
            const updatedWithdrawal = await ppeService.collectWithdrawal(withdrawalId, updateData);
            setWithdrawal(updatedWithdrawal);
            toast.success('Withdrawal collected successfully');
            return updatedWithdrawal;
        } catch (err) {
            toast.error('Failed to collect withdrawal');
            throw err;
        }
    }, []);

    const cancelWithdrawal = useCallback(async (withdrawalId: string, updateData?: UpdatePPEWithdrawalDTO) => {
        try {
            const updatedWithdrawal = await ppeService.cancelWithdrawal(withdrawalId, updateData);
            setWithdrawal(updatedWithdrawal);
            toast.success('Withdrawal cancelled successfully');
            return updatedWithdrawal;
        } catch (err) {
            toast.error('Failed to cancel withdrawal');
            throw err;
        }
    }, []);

    useEffect(() => {
        if (id) {
            fetchWithdrawal(id);
        }
    }, [id, fetchWithdrawal]);

    return {
        withdrawal,
        isLoading,
        error,
        fetchWithdrawal,
        setWithdrawal,
        approveWithdrawal,
        collectWithdrawal,
        cancelWithdrawal,
    };
};

