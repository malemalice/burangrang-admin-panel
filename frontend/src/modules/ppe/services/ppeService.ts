import api from '@/core/lib/api';
import {
    PPEStock,
    PPEStockDTO,
    PPEStockItem,
    PPEStockItemDTO,
    PPEWithdrawal,
    PPEWithdrawalDTO,
    CreatePPEStockDTO,
    UpdatePPEStockDTO,
    CreatePPEWithdrawalDTO,
    UpdatePPEWithdrawalDTO,
    CreateStockAdjustmentDTO,
    PaginatedResponse,
    PaginationParams,
    PPEStockSearchParams,
    PPEStockItemSearchParams,
    PPEWithdrawalSearchParams,
} from '../types/ppe.types';

// Convert DTOs to frontend models
const mapPPEStockItemDtoToPPEStockItem = (itemDto: PPEStockItemDTO): PPEStockItem => ({
    id: itemDto.id,
    stockId: itemDto.stockId,
    safetyEquipmentId: itemDto.safetyEquipmentId,
    equipmentName: itemDto.equipmentName,
    equipmentType: itemDto.equipmentType,
    equipmentSize: itemDto.equipmentSize,
    expiryDate: itemDto.expiryDate,
    initialQuantity: itemDto.initialQuantity,
    currentQuantity: itemDto.currentQuantity,
    reservedQuantity: itemDto.reservedQuantity,
    status: itemDto.status as any,
    order: itemDto.order,
    createdAt: itemDto.createdAt,
    updatedAt: itemDto.updatedAt,
});

const mapPPEStockDtoToPPEStock = (stockDto: PPEStockDTO): PPEStock => ({
    id: stockDto.id,
    stockCode: stockDto.stockCode,
    receivedDate: stockDto.receivedDate,
    notes: stockDto.notes,
    isActive: stockDto.isActive,
    createdAt: stockDto.createdAt,
    updatedAt: stockDto.updatedAt,
    createdBy: stockDto.createdBy,
    items: stockDto.items?.map(mapPPEStockItemDtoToPPEStockItem),
});

const mapPPEWithdrawalItemDtoToPPEWithdrawalItem = (itemDto: any): any => ({
    id: itemDto.id,
    withdrawalId: itemDto.withdrawalId,
    stockItemId: itemDto.stockItemId,
    requestedQuantity: itemDto.requestedQuantity,
    approvedQuantity: itemDto.approvedQuantity,
    issuedQuantity: itemDto.issuedQuantity,
    order: itemDto.order,
    notes: itemDto.notes,
    createdAt: itemDto.createdAt,
    updatedAt: itemDto.updatedAt,
});

const mapPPEWithdrawalDtoToPPEWithdrawal = (withdrawalDto: PPEWithdrawalDTO): PPEWithdrawal => ({
    id: withdrawalDto.id,
    withdrawalCode: withdrawalDto.withdrawalCode,
    withdrawalDate: withdrawalDto.withdrawalDate,
    requestedBy: withdrawalDto.requestedBy,
    requestedFor: withdrawalDto.requestedFor,
    requestedForName: withdrawalDto.requestedForName,
    departmentId: withdrawalDto.departmentId,
    jobPositionId: withdrawalDto.jobPositionId,
    jobPositionName: withdrawalDto.jobPositionName,
    status: withdrawalDto.status as any,
    withdrawalLetterUrl: withdrawalDto.withdrawalLetterUrl,
    collectedDate: withdrawalDto.collectedDate,
    collectedBy: withdrawalDto.collectedBy,
    notes: withdrawalDto.notes,
    isActive: withdrawalDto.isActive,
    createdAt: withdrawalDto.createdAt,
    updatedAt: withdrawalDto.updatedAt,
    createdBy: withdrawalDto.createdBy,
    items: withdrawalDto.items?.map(mapPPEWithdrawalItemDtoToPPEWithdrawalItem),
});

const ppeService = {
    // ============================================================================
    // STOCK ITEMS (Master Data)
    // ============================================================================

    getAvailableStockItems: async (params: PPEStockItemSearchParams): Promise<PaginatedResponse<PPEStockItem>> => {
        try {
            const queryParams = new URLSearchParams({
                page: params.page.toString(),
                limit: params.limit.toString(),
            });

            if (params.sortBy) {
                queryParams.append('sortBy', params.sortBy);
                queryParams.append('sortOrder', params.sortOrder || 'asc');
            }

            if (params.search) {
                queryParams.append('search', params.search);
            }

            if (params.status) {
                queryParams.append('status', params.status);
            }

            if (params.stockId) {
                queryParams.append('stockId', params.stockId);
            }

            if (params.availableOnly !== undefined) {
                queryParams.append('availableOnly', params.availableOnly.toString());
            }

            const response = await api.get(`/ppe/stock-items/available?${queryParams.toString()}`);
            return {
                data: response.data.data.map(mapPPEStockItemDtoToPPEStockItem),
                meta: response.data.meta,
            };
        } catch (error) {
            console.error('Error fetching available stock items:', error);
            throw error;
        }
    },

    getStockItems: async (params: PPEStockItemSearchParams): Promise<PaginatedResponse<PPEStockItem>> => {
        try {
            const queryParams = new URLSearchParams({
                page: params.page.toString(),
                limit: params.limit.toString(),
            });

            if (params.sortBy) {
                queryParams.append('sortBy', params.sortBy);
                queryParams.append('sortOrder', params.sortOrder || 'asc');
            }

            if (params.search) {
                queryParams.append('search', params.search);
            }

            if (params.status) {
                queryParams.append('status', params.status);
            }

            if (params.stockId) {
                queryParams.append('stockId', params.stockId);
            }

            const response = await api.get(`/ppe/stock-items?${queryParams.toString()}`);
            return {
                data: response.data.data.map(mapPPEStockItemDtoToPPEStockItem),
                meta: response.data.meta,
            };
        } catch (error) {
            console.error('Error fetching stock items:', error);
            throw error;
        }
    },

    // ============================================================================
    // STOCK IN
    // ============================================================================

    getStocks: async (params: PPEStockSearchParams): Promise<PaginatedResponse<PPEStock>> => {
        try {
            const queryParams = new URLSearchParams({
                page: params.page.toString(),
                limit: params.limit.toString(),
            });

            if (params.sortBy) {
                queryParams.append('sortBy', params.sortBy);
                queryParams.append('sortOrder', params.sortOrder || 'desc');
            }

            if (params.search) {
                queryParams.append('search', params.search);
            }

            if (params.isActive !== undefined) {
                queryParams.append('isActive', params.isActive.toString());
            }

            if (params.receivedDateFrom) {
                queryParams.append('receivedDateFrom', params.receivedDateFrom);
            }

            if (params.receivedDateTo) {
                queryParams.append('receivedDateTo', params.receivedDateTo);
            }

            const response = await api.get(`/ppe/stocks?${queryParams.toString()}`);
            return {
                data: response.data.data.map(mapPPEStockDtoToPPEStock),
                meta: response.data.meta,
            };
        } catch (error) {
            console.error('Error fetching stocks:', error);
            throw error;
        }
    },

    getStockById: async (id: string): Promise<PPEStock> => {
        try {
            const response = await api.get(`/ppe/stocks/${id}`);
            return mapPPEStockDtoToPPEStock(response.data);
        } catch (error: any) {
            console.error(`Error fetching stock ${id}:`, error);
            const errorMessage = error.response?.data?.message || 'Failed to fetch stock';
            throw new Error(errorMessage);
        }
    },

    createStock: async (stockData: CreatePPEStockDTO): Promise<PPEStock> => {
        try {
            const response = await api.post('/ppe/stocks', stockData);
            return mapPPEStockDtoToPPEStock(response.data);
        } catch (error: any) {
            console.error('Error creating stock:', error);
            const errorMessage = error.response?.data?.message || 'Failed to create stock';
            throw new Error(errorMessage);
        }
    },

    updateStock: async (id: string, stockData: UpdatePPEStockDTO): Promise<PPEStock> => {
        try {
            const response = await api.patch(`/ppe/stocks/${id}`, stockData);
            return mapPPEStockDtoToPPEStock(response.data);
        } catch (error: any) {
            console.error(`Error updating stock ${id}:`, error);
            const errorMessage = error.response?.data?.message || 'Failed to update stock';
            throw new Error(errorMessage);
        }
    },

    updateStockItem: async (
        stockId: string,
        itemId: string,
        updateData: Partial<{
            currentQuantity: number;
            reservedQuantity: number;
            status: string;
            expiryDate: string;
        }>,
    ): Promise<PPEStockItem> => {
        try {
            const response = await api.patch(`/ppe/stocks/${stockId}/items/${itemId}`, updateData);
            return mapPPEStockItemDtoToPPEStockItem(response.data);
        } catch (error: any) {
            console.error(`Error updating stock item ${itemId}:`, error);
            const errorMessage = error.response?.data?.message || 'Failed to update stock item';
            throw new Error(errorMessage);
        }
    },

    adjustStockItem: async (
        stockId: string,
        itemId: string,
        adjustmentData: CreateStockAdjustmentDTO,
    ): Promise<void> => {
        try {
            await api.post(`/ppe/stocks/${stockId}/items/${itemId}/adjust`, adjustmentData);
        } catch (error: any) {
            console.error(`Error adjusting stock item ${itemId}:`, error);
            const errorMessage = error.response?.data?.message || 'Failed to adjust stock item';
            throw new Error(errorMessage);
        }
    },

    // ============================================================================
    // WITHDRAWAL
    // ============================================================================

    getWithdrawals: async (params: PPEWithdrawalSearchParams): Promise<PaginatedResponse<PPEWithdrawal>> => {
        try {
            const queryParams = new URLSearchParams({
                page: params.page.toString(),
                limit: params.limit.toString(),
            });

            if (params.sortBy) {
                queryParams.append('sortBy', params.sortBy);
                queryParams.append('sortOrder', params.sortOrder || 'desc');
            }

            if (params.search) {
                queryParams.append('search', params.search);
            }

            if (params.status) {
                queryParams.append('status', params.status);
            }

            if (params.isActive !== undefined) {
                queryParams.append('isActive', params.isActive.toString());
            }

            if (params.departmentId) {
                queryParams.append('departmentId', params.departmentId);
            }

            if (params.withdrawalDateFrom) {
                queryParams.append('withdrawalDateFrom', params.withdrawalDateFrom);
            }

            if (params.withdrawalDateTo) {
                queryParams.append('withdrawalDateTo', params.withdrawalDateTo);
            }

            const response = await api.get(`/ppe/withdrawals?${queryParams.toString()}`);
            return {
                data: response.data.data.map(mapPPEWithdrawalDtoToPPEWithdrawal),
                meta: response.data.meta,
            };
        } catch (error) {
            console.error('Error fetching withdrawals:', error);
            throw error;
        }
    },

    getWithdrawalById: async (id: string): Promise<PPEWithdrawal> => {
        try {
            const response = await api.get(`/ppe/withdrawals/${id}`);
            return mapPPEWithdrawalDtoToPPEWithdrawal(response.data);
        } catch (error: any) {
            console.error(`Error fetching withdrawal ${id}:`, error);
            const errorMessage = error.response?.data?.message || 'Failed to fetch withdrawal';
            throw new Error(errorMessage);
        }
    },

    createWithdrawal: async (withdrawalData: CreatePPEWithdrawalDTO): Promise<PPEWithdrawal> => {
        try {
            const response = await api.post('/ppe/withdrawals', withdrawalData);
            return mapPPEWithdrawalDtoToPPEWithdrawal(response.data);
        } catch (error: any) {
            console.error('Error creating withdrawal:', error);
            const errorMessage = error.response?.data?.message || 'Failed to create withdrawal';
            throw new Error(errorMessage);
        }
    },

    approveWithdrawal: async (id: string, updateData: UpdatePPEWithdrawalDTO): Promise<PPEWithdrawal> => {
        try {
            const response = await api.patch(`/ppe/withdrawals/${id}/approve`, updateData);
            return mapPPEWithdrawalDtoToPPEWithdrawal(response.data);
        } catch (error: any) {
            console.error(`Error approving withdrawal ${id}:`, error);
            const errorMessage = error.response?.data?.message || 'Failed to approve withdrawal';
            throw new Error(errorMessage);
        }
    },

    collectWithdrawal: async (id: string, updateData: UpdatePPEWithdrawalDTO): Promise<PPEWithdrawal> => {
        try {
            const response = await api.patch(`/ppe/withdrawals/${id}/collect`, updateData);
            return mapPPEWithdrawalDtoToPPEWithdrawal(response.data);
        } catch (error: any) {
            console.error(`Error collecting withdrawal ${id}:`, error);
            const errorMessage = error.response?.data?.message || 'Failed to collect withdrawal';
            throw new Error(errorMessage);
        }
    },

    updateWithdrawal: async (id: string, withdrawalData: CreatePPEWithdrawalDTO): Promise<PPEWithdrawal> => {
        try {
            const response = await api.patch(`/ppe/withdrawals/${id}`, withdrawalData);
            return mapPPEWithdrawalDtoToPPEWithdrawal(response.data);
        } catch (error: any) {
            console.error(`Error updating withdrawal ${id}:`, error);
            const errorMessage = error.response?.data?.message || 'Failed to update withdrawal';
            throw new Error(errorMessage);
        }
    },

    cancelWithdrawal: async (id: string, updateData?: UpdatePPEWithdrawalDTO): Promise<PPEWithdrawal> => {
        try {
            const response = await api.patch(`/ppe/withdrawals/${id}/cancel`, updateData || {});
            return mapPPEWithdrawalDtoToPPEWithdrawal(response.data);
        } catch (error: any) {
            console.error(`Error cancelling withdrawal ${id}:`, error);
            const errorMessage = error.response?.data?.message || 'Failed to cancel withdrawal';
            throw new Error(errorMessage);
        }
    },
};

export default ppeService;

