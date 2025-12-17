/**
 * PPE module types
 */

// Import core types for use in this file
import type { PaginatedResponse, PaginationParams } from '@/core/lib/types';

// =============================================================================
// ENUMS
// =============================================================================

export enum PPEStockStatus {
    AVAILABLE = 'AVAILABLE',
    RESERVED = 'RESERVED',
    ISSUED = 'ISSUED',
    EXPIRED = 'EXPIRED',
    DISPOSED = 'DISPOSED',
}

export enum PPEWithdrawalStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    COLLECTED = 'COLLECTED',
    CANCELLED = 'CANCELLED',
}

export enum AdjustmentType {
    DISPOSAL = 'DISPOSAL',
    DAMAGE = 'DAMAGE',
    CORRECTION = 'CORRECTION',
    EXPIRY_REMOVAL = 'EXPIRY_REMOVAL',
    RETURN = 'RETURN',
}

// =============================================================================
// PPE STOCK TYPES
// =============================================================================

export interface PPEStockItemDTO {
    id: string;
    stockId: string;
    safetyEquipmentId?: string | null;
    equipmentName?: string | null;
    equipmentType?: string | null;
    equipmentSize?: string | null;
    expiryDate?: string | null;
    initialQuantity: number;
    currentQuantity: number;
    reservedQuantity: number;
    status: PPEStockStatus;
    order: number;
    createdAt: string;
    updatedAt: string;
}

export interface PPEStockItem {
    id: string;
    stockId: string;
    safetyEquipmentId?: string | null;
    equipmentName?: string | null;
    equipmentType?: string | null;
    equipmentSize?: string | null;
    expiryDate?: string | null;
    initialQuantity: number;
    currentQuantity: number;
    reservedQuantity: number;
    status: PPEStockStatus;
    order: number;
    createdAt: string;
    updatedAt: string;
    // Support for grouped items
    stockItemIds?: string[];
    isGrouped?: boolean;
}

export interface PPEStockDTO {
    id: string;
    stockCode: string;
    receivedDate: string;
    notes?: string | null;
    isActive: boolean;
    deletedAt?: string | null;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    items?: PPEStockItemDTO[];
}

export interface PPEStock {
    id: string;
    stockCode: string;
    receivedDate: string;
    notes?: string | null;
    isActive: boolean;
    deletedAt?: string | null;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    items?: PPEStockItem[];
}

export interface CreatePPEStockItemDTO {
    safetyEquipmentId?: string;
    equipmentName?: string;
    equipmentType?: string;
    equipmentSize?: string;
    expiryDate?: string;
    initialQuantity: number;
    order: number;
}

export interface UpdatePPEStockItemDTO {
    id?: string;
    safetyEquipmentId?: string;
    equipmentName?: string;
    equipmentType?: string;
    equipmentSize?: string;
    expiryDate?: string;
    initialQuantity?: number;
    order?: number;
}

export interface CreatePPEStockDTO {
    receivedDate: string;
    notes?: string;
    isActive?: boolean;
    items: CreatePPEStockItemDTO[];
}

export interface UpdatePPEStockDTO {
    receivedDate?: string;
    notes?: string;
    isActive?: boolean;
    items?: UpdatePPEStockItemDTO[];
}

// =============================================================================
// PPE WITHDRAWAL TYPES
// =============================================================================

export interface PPEWithdrawalItemDTO {
    id: string;
    withdrawalId: string;
    stockItemId: string;
    requestedQuantity: number;
    approvedQuantity?: number | null;
    issuedQuantity?: number | null;
    order: number;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface PPEWithdrawalItem {
    id: string;
    withdrawalId: string;
    stockItemId: string;
    stockItemEquipmentName?: string | null;
    stockItemEquipmentType?: string | null;
    stockItemEquipmentSize?: string | null;
    requestedQuantity: number;
    approvedQuantity?: number | null;
    issuedQuantity?: number | null;
    order: number;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface PPEWithdrawalDTO {
    id: string;
    withdrawalCode: string;
    withdrawalDate: string;
    requestedBy: string;
    requestedFor?: string | null;
    requestedForName?: string | null;
    departmentId: string;
    jobPositionId?: string | null;
    jobPositionName?: string | null;
    status: PPEWithdrawalStatus;
    withdrawalLetterUrl?: string | null;
    collectedDate?: string | null;
    collectedBy?: string | null;
    notes?: string | null;
    isActive: boolean;
    deletedAt?: string | null;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    items?: PPEWithdrawalItemDTO[];
}

export interface PPEWithdrawal {
    id: string;
    withdrawalCode: string;
    withdrawalDate: string;
    requestedBy: string;
    requestedFor?: string | null;
    requestedForName?: string | null;
    departmentId: string;
    departmentName?: string | null;
    jobPositionId?: string | null;
    jobPositionName?: string | null;
    status: PPEWithdrawalStatus;
    withdrawalLetterUrl?: string | null;
    collectedDate?: string | null;
    collectedBy?: string | null;
    notes?: string | null;
    isActive: boolean;
    deletedAt?: string | null;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    items?: PPEWithdrawalItem[];
}

export interface CreatePPEWithdrawalItemDTO {
    stockItemId: string;
    requestedQuantity: number;
    order: number;
    notes?: string;
}

export interface CreatePPEWithdrawalDTO {
    withdrawalDate: string;
    requestedFor?: string;
    requestedForName?: string;
    departmentId: string;
    jobPositionId?: string;
    jobPositionName?: string;
    withdrawalLetterUrl?: string;
    notes?: string;
    items: CreatePPEWithdrawalItemDTO[];
}

export interface UpdatePPEWithdrawalDTO {
    approvedQuantities?: Record<string, number>;
    issuedQuantities?: Record<string, number>;
    collectedBy?: string;
    notes?: string;
}

// =============================================================================
// STOCK ADJUSTMENT TYPES
// =============================================================================

export interface CreateStockAdjustmentDTO {
    adjustmentType: AdjustmentType;
    quantityAfter: number;
    reason: string;
}

// =============================================================================
// SEARCH PARAMS TYPES
// =============================================================================

export interface PPEStockSearchParams extends Omit<PaginationParams, 'filters'> {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    isActive?: boolean;
    receivedDateFrom?: string;
    receivedDateTo?: string;
}

export interface PPEStockItemSearchParams extends Omit<PaginationParams, 'filters'> {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    status?: PPEStockStatus;
    stockId?: string;
    availableOnly?: boolean;
    groupBySafetyEquipment?: boolean;
    includeExpired?: boolean;
}

export interface PPEWithdrawalSearchParams extends Omit<PaginationParams, 'filters'> {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    status?: PPEWithdrawalStatus;
    isActive?: boolean;
    departmentId?: string;
    withdrawalDateFrom?: string;
    withdrawalDateTo?: string;
}

