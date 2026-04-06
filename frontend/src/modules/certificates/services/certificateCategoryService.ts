import api from '@/core/lib/api';
import {
    CertificateCategory,
    CertificateCategoryDTO,
    CreateCertificateCategoryDTO,
    UpdateCertificateCategoryDTO,
    PaginatedResponse,
    PaginationParams,
} from '../types/certificate.types';

// Convert CertificateCategoryDTO from backend to CertificateCategory model for frontend
const mapCategoryDtoToCategory = (
    categoryDto: CertificateCategoryDTO,
): CertificateCategory => {
    return {
        id: categoryDto.id,
        name: categoryDto.name,
        code: categoryDto.code,
        certificateType: categoryDto.certificateType,
        description: categoryDto.description || undefined,
        isActive: categoryDto.isActive,
        createdAt: categoryDto.createdAt,
        updatedAt: categoryDto.updatedAt,
        responsibleDepartments: (categoryDto.responsibleDepartments ?? []).map((d) => ({
            id: d.id,
            name: d.name,
            emails: d.emails ?? undefined,
        })),
    };
};

const certificateCategoryService = {
    // Get all categories with pagination
    getCategories: async (
        params: PaginationParams & {
            isActive?: boolean;
            certificateType?: string;
            responsibleDepartmentId?: string;
        },
    ): Promise<PaginatedResponse<CertificateCategory>> => {
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

            // Handle isActive filter (boolean)
            if (params.isActive !== undefined) {
                queryParams.append('isActive', params.isActive.toString());
            }

            // Handle certificateType filter
            if (params.certificateType) {
                queryParams.append('certificateType', params.certificateType);
            }

            if (params.responsibleDepartmentId) {
                queryParams.append('responsibleDepartmentId', params.responsibleDepartmentId);
            }

            // Handle other filters from params.filters
            if (params.filters) {
                Object.entries(params.filters).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== '' && key !== 'isActive' && key !== 'certificateType') {
                        queryParams.append(key, value.toString());
                    }
                });
            }

            const response = await api.get(
                `/certificates/categories?${queryParams.toString()}`,
            );
            return {
                data: response.data.data.map(mapCategoryDtoToCategory),
                meta: response.data.meta,
            };
        } catch (error: any) {
            console.error('Error fetching certificate categories:', error);
            const errorMessage =
                error.response?.data?.message || 'Failed to fetch certificate categories';
            throw new Error(errorMessage);
        }
    },

    // Get a single category by ID
    getCategoryById: async (id: string): Promise<CertificateCategory> => {
        try {
            const response = await api.get(`/certificates/categories/${id}`);
            return mapCategoryDtoToCategory(response.data);
        } catch (error: any) {
            console.error(`Error fetching certificate category ${id}:`, error);
            const errorMessage =
                error.response?.data?.message || `Failed to fetch certificate category ${id}`;
            throw new Error(errorMessage);
        }
    },

    // Create a new category
    createCategory: async (
        data: CreateCertificateCategoryDTO,
    ): Promise<CertificateCategory> => {
        try {
            const response = await api.post('/certificates/categories', data);
            return mapCategoryDtoToCategory(response.data);
        } catch (error: any) {
            console.error('Error creating certificate category:', error);
            const errorMessage =
                error.response?.data?.message || 'Failed to create certificate category';
            throw new Error(errorMessage);
        }
    },

    // Update an existing category
    updateCategory: async (
        id: string,
        data: UpdateCertificateCategoryDTO,
    ): Promise<CertificateCategory> => {
        try {
            const response = await api.patch(`/certificates/categories/${id}`, data);
            return mapCategoryDtoToCategory(response.data);
        } catch (error: any) {
            console.error(`Error updating certificate category ${id}:`, error);
            const errorMessage =
                error.response?.data?.message || `Failed to update certificate category ${id}`;
            throw new Error(errorMessage);
        }
    },

    // Delete a category (soft delete)
    deleteCategory: async (id: string): Promise<void> => {
        try {
            await api.delete(`/certificates/categories/${id}`);
        } catch (error: any) {
            console.error(`Error deleting certificate category ${id}:`, error);
            const errorMessage =
                error.response?.data?.message || `Failed to delete certificate category ${id}`;
            throw new Error(errorMessage);
        }
    },
};

export default certificateCategoryService;

