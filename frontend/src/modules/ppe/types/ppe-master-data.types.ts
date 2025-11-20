/**
 * PPE Master Data module types
 */

// Re-export core types
export type { PaginatedResponse, PaginationParams } from '@/core/lib/types';

// =============================================================================
// SAFETY EQUIPMENT TYPE TYPES
// =============================================================================

export interface SafetyEquipmentType {
    id: string;
    name: string;
    code: string;
    description?: string | null;
    isActive: boolean;
    deletedAt?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface SafetyEquipmentTypeDTO {
    id: string;
    name: string;
    code: string;
    description?: string | null;
    isActive: boolean;
    deletedAt?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSafetyEquipmentTypeDTO {
    name: string;
    code: string;
    description?: string;
    isActive?: boolean;
}

export interface UpdateSafetyEquipmentTypeDTO {
    name?: string;
    code?: string;
    description?: string;
    isActive?: boolean;
}

// =============================================================================
// SAFETY EQUIPMENT TYPES
// =============================================================================

export enum SafetyEquipmentCategory {
    PERSONAL_PROTECTIVE_EQUIPMENT = 'PERSONAL_PROTECTIVE_EQUIPMENT',
    SAFETY_EQUIPMENT = 'SAFETY_EQUIPMENT',
    EMERGENCY_EQUIPMENT = 'EMERGENCY_EQUIPMENT',
}

export interface SafetyEquipment {
    id: string;
    name: string;
    code: string;
    safetyEquipmentTypeId: string;
    safetyEquipmentType?: SafetyEquipmentType;
    size?: string | null;
    description?: string | null;
    category: SafetyEquipmentCategory;
    isActive: boolean;
    deletedAt?: string | null;
    createdAt: string;
    updatedAt: string;
    currentStock?: number;
}

export interface SafetyEquipmentDTO {
    id: string;
    name: string;
    code: string;
    safetyEquipmentTypeId: string;
    safetyEquipmentType?: SafetyEquipmentTypeDTO;
    size?: string | null;
    description?: string | null;
    category: SafetyEquipmentCategory;
    isActive: boolean;
    deletedAt?: string | null;
    createdAt: string;
    updatedAt: string;
    currentStock?: number;
}

export interface CreateSafetyEquipmentDTO {
    name: string;
    code: string;
    safetyEquipmentTypeId: string;
    size?: string;
    description?: string;
    category: SafetyEquipmentCategory;
    isActive?: boolean;
}

export interface UpdateSafetyEquipmentDTO {
    name?: string;
    code?: string;
    safetyEquipmentTypeId?: string;
    size?: string;
    description?: string;
    category?: SafetyEquipmentCategory;
    isActive?: boolean;
}

