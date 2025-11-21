import api from '@/core/lib/api';
import type { PaginatedResponse, PaginationParams } from '@/core/lib/types';
import {
    SafetyEquipment,
    SafetyEquipmentDTO,
    SafetyEquipmentTypeDTO,
    CreateSafetyEquipmentDTO,
    UpdateSafetyEquipmentDTO,
} from '../types/ppe-master-data.types';

// Convert SafetyEquipmentDTO from backend to SafetyEquipment model for frontend
const mapSafetyEquipmentDtoToSafetyEquipment = (
    dto: SafetyEquipmentDTO,
): SafetyEquipment => {
    return {
        id: dto.id,
        name: dto.name,
        code: dto.code,
        safetyEquipmentTypeId: dto.safetyEquipmentTypeId,
        safetyEquipmentType: dto.safetyEquipmentType
            ? {
                id: dto.safetyEquipmentType.id,
                name: dto.safetyEquipmentType.name,
                code: dto.safetyEquipmentType.code,
                description: dto.safetyEquipmentType.description || null,
                isActive: dto.safetyEquipmentType.isActive,
                deletedAt: dto.safetyEquipmentType.deletedAt || null,
                createdAt: dto.safetyEquipmentType.createdAt,
                updatedAt: dto.safetyEquipmentType.updatedAt,
            }
            : undefined,
        size: dto.size || null,
        description: dto.description || null,
        category: dto.category,
        isActive: dto.isActive,
        deletedAt: dto.deletedAt || null,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
        currentStock: dto.currentStock || 0,
    };
};

const safetyEquipmentService = {
    // Get all safety equipments with pagination and filtering
    async getSafetyEquipments(
        params: PaginationParams,
    ): Promise<PaginatedResponse<SafetyEquipment>> {
        try {
            const queryParams = new URLSearchParams({
                page: params.page.toString(),
                limit: params.limit.toString(),
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

            const response = await api.get(
                `/ppe/safety-equipments?${queryParams.toString()}`,
            );
            return {
                data: response.data.data.map(mapSafetyEquipmentDtoToSafetyEquipment),
                meta: response.data.meta,
            };
        } catch (error: any) {
            console.error('Error fetching safety equipments:', error);
            const errorMessage = error.response?.data?.message || 'Failed to fetch safety equipments';
            throw new Error(errorMessage);
        }
    },

    // Get a single safety equipment by ID
    async getSafetyEquipment(id: string): Promise<SafetyEquipment> {
        try {
            const response = await api.get(`/ppe/safety-equipments/${id}`);
            return mapSafetyEquipmentDtoToSafetyEquipment(response.data);
        } catch (error: any) {
            console.error(`Error fetching safety equipment ${id}:`, error);
            const errorMessage = error.response?.data?.message || 'Failed to fetch safety equipment';
            throw new Error(errorMessage);
        }
    },

    // Create a new safety equipment
    async createSafetyEquipment(
        data: CreateSafetyEquipmentDTO,
    ): Promise<SafetyEquipment> {
        try {
            const response = await api.post('/ppe/safety-equipments', data);
            return mapSafetyEquipmentDtoToSafetyEquipment(response.data);
        } catch (error: any) {
            console.error('Error creating safety equipment:', error);
            const errorMessage = error.response?.data?.message || 'Failed to create safety equipment';
            throw new Error(errorMessage);
        }
    },

    // Update an existing safety equipment
    async updateSafetyEquipment(
        id: string,
        data: UpdateSafetyEquipmentDTO,
    ): Promise<SafetyEquipment> {
        try {
            const response = await api.patch(`/ppe/safety-equipments/${id}`, data);
            return mapSafetyEquipmentDtoToSafetyEquipment(response.data);
        } catch (error: any) {
            console.error(`Error updating safety equipment ${id}:`, error);
            const errorMessage = error.response?.data?.message || 'Failed to update safety equipment';
            throw new Error(errorMessage);
        }
    },

    // Delete a safety equipment (soft delete)
    async deleteSafetyEquipment(id: string): Promise<void> {
        try {
            await api.delete(`/ppe/safety-equipments/${id}`);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to delete safety equipment';
            throw new Error(errorMessage);
        }
    },
};

export default safetyEquipmentService;

