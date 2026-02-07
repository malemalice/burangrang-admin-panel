import api from '@/core/lib/api';
import {
  AuditCriteria,
  PaginatedResponse,
  PaginationParams,
  AuditCriteriaDTO,
  CreateAuditCriteriaDTO,
  UpdateAuditCriteriaDTO,
} from '../types/audit-criteria.types';

// Convert AuditCriteriaDTO from backend to AuditCriteria model for frontend
const mapAuditCriteriaDtoToAuditCriteria = (criteriaDto: AuditCriteriaDTO): AuditCriteria => {
  return {
    id: criteriaDto.id,
    name: criteriaDto.name,
    code: criteriaDto.code,
    description: criteriaDto.description,
    auditClauseId: criteriaDto.auditClauseId,
    clauseName: criteriaDto.auditClause?.name || '',
    auditElementId: criteriaDto.auditClause?.auditElement?.id || '',
    elementName: criteriaDto.auditClause?.auditElement?.name || '',
    transitionType: criteriaDto.transitionType,
    order: criteriaDto.order,
    isActive: criteriaDto.isActive,
    createdAt: criteriaDto.createdAt,
    updatedAt: criteriaDto.updatedAt,
  };
};

const auditCriteriaService = {
  // Get all audit criteria with pagination and filtering
  getAuditCriteria: async (params: PaginationParams): Promise<PaginatedResponse<AuditCriteria>> => {
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
            if (key === 'criteriaName') {
              // Map criteriaName to search parameter
              queryParams.append('search', value.toString());
            } else if (key === 'transitionType') {
              queryParams.append('transitionType', value.toString());
            } else if (key === 'auditClauseId') {
              queryParams.append('auditClauseId', value.toString());
            } else if (key === 'auditElementId') {
              queryParams.append('auditElementId', value.toString());
            } else if (key === 'isActive') {
              queryParams.append('isActive', value.toString());
            }
          }
        });
      }

      const response = await api.get(`/audit-criteria?${queryParams.toString()}`);
      return {
        data: response.data.data.map(mapAuditCriteriaDtoToAuditCriteria),
        meta: response.data.meta,
      };
    } catch (error) {
      console.error('Error fetching audit criteria:', error);
      throw error;
    }
  },

  // Get a single audit criteria by ID
  getAuditCriteriaById: async (id: string): Promise<AuditCriteria> => {
    try {
      const response = await api.get(`/audit-criteria/${id}`);
      return mapAuditCriteriaDtoToAuditCriteria(response.data);
    } catch (error) {
      console.error(`Error fetching audit criteria ${id}:`, error);
      throw error;
    }
  },

  // Create a new audit criteria
  createAuditCriteria: async (criteriaData: CreateAuditCriteriaDTO): Promise<AuditCriteria> => {
    try {
      const response = await api.post('/audit-criteria', criteriaData);
      return mapAuditCriteriaDtoToAuditCriteria(response.data);
    } catch (error: any) {
      console.error('Error creating audit criteria:', error);
      const raw = error.response?.data?.message;
      const errorMessage = Array.isArray(raw) ? raw.join(' ') : raw || 'Failed to create audit criteria';
      throw new Error(errorMessage);
    }
  },

  // Update an existing audit criteria
  updateAuditCriteria: async (
    id: string,
    criteriaData: UpdateAuditCriteriaDTO,
  ): Promise<AuditCriteria> => {
    try {
      const response = await api.patch(`/audit-criteria/${id}`, criteriaData);
      return mapAuditCriteriaDtoToAuditCriteria(response.data);
    } catch (error: any) {
      console.error(`Error updating audit criteria ${id}:`, error);
      const raw = error.response?.data?.message;
      const errorMessage = Array.isArray(raw) ? raw.join(' ') : raw || 'Failed to update audit criteria';
      throw new Error(errorMessage);
    }
  },

  // Delete an audit criteria
  deleteAuditCriteria: async (id: string): Promise<void> => {
    try {
      await api.delete(`/audit-criteria/${id}`);
    } catch (error: any) {
      console.error(`Error deleting audit criteria ${id}:`, error);
      const errorMessage = error.response?.data?.message || 'Failed to delete audit criteria';
      throw new Error(errorMessage);
    }
  },
};

export default auditCriteriaService;
