import api from '@/core/lib/api';
import {
    SafetyEquipmentType,
    SafetyEquipmentTypeDTO,
    CreateSafetyEquipmentTypeDTO,
    UpdateSafetyEquipmentTypeDTO,
    PaginatedResponse,
    PaginationParams,
} from '../types/ppe-master-data.types';

// Convert SafetyEquipmentTypeDTO from backend to SafetyEquipmentType model for frontend
const mapSafetyEquipmentTypeDtoToSafetyEquipmentType = (
    dto: SafetyEquipmentTypeDTO,
): SafetyEquipmentType => {
    return {
        id: dto.id,
        name: dto.name,
        code: dto.code,
        description: dto.description || null,
        isActive: dto.isActive,
        deletedAt: dto.deletedAt || null,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
    };
};

const safetyEquipmentTypeService = {
    // Get all safety equipment types with pagination and filtering
    async getSafetyEquipmentTypes(
        params: PaginationParams,
    ): Promise<PaginatedResponse<SafetyEquipmentType>> {
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
                `/ppe/safety-equipment-types?${queryParams.toString()}`,
            );
            return {
                data: response.data.data.map(mapSafetyEquipmentTypeDtoToSafetyEquipmentType),
                meta: response.data.meta,
            };
        } catch (error) {
            console.error('Error fetching safety equipment types:', error);
            throw error;
        }
    },

    // Get a single safety equipment type by ID
    async getSafetyEquipmentType(id: string): Promise<SafetyEquipmentType> {
        const response = await api.get(`/ppe/safety-equipment-types/${id}`);
        return mapSafetyEquipmentTypeDtoToSafetyEquipmentType(response.data);
    },

    // Create a new safety equipment type
    async createSafetyEquipmentType(
        data: CreateSafetyEquipmentTypeDTO,
    ): Promise<SafetyEquipmentType> {
        const response = await api.post('/ppe/safety-equipment-types', data);
        return mapSafetyEquipmentTypeDtoToSafetyEquipmentType(response.data);
    },

    // Update an existing safety equipment type
    async updateSafetyEquipmentType(
        id: string,
        data: UpdateSafetyEquipmentTypeDTO,
    ): Promise<SafetyEquipmentType> {
        const response = await api.patch(`/ppe/safety-equipment-types/${id}`, data);
        return mapSafetyEquipmentTypeDtoToSafetyEquipmentType(response.data);
    },

    // Delete a safety equipment type (soft delete)
    async deleteSafetyEquipmentType(id: string): Promise<void> {
        try {
            await api.delete(`/ppe/safety-equipment-types/${id}`);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to delete safety equipment type';
            throw new Error(errorMessage);
        }
    },
};

export default safetyEquipmentTypeService;

