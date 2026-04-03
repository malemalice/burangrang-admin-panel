import api from '@/core/lib/api';
import {
  CompanyDTO,
  CreateCompanyDTO,
  PaginatedResponse,
  PaginationParams,
  UpdateCompanyDTO,
} from '../types/master-data.types';

const companyService = {
  async getCompanies(params: PaginationParams): Promise<PaginatedResponse<CompanyDTO>> {
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

      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }

      if (params.options) {
        queryParams.append('options', 'true');
      }

      const response = await api.get(`/companies?${queryParams.toString()}`);

      return {
        data: response.data.data,
        meta: response.data.meta,
      };
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  },

  async getCompany(id: string): Promise<CompanyDTO> {
    const response = await api.get<CompanyDTO>(`/companies/${id}`);
    return response.data;
  },

  async createCompany(data: CreateCompanyDTO): Promise<CompanyDTO> {
    const response = await api.post<CompanyDTO>('/companies', data);
    return response.data;
  },

  async updateCompany(id: string, data: UpdateCompanyDTO): Promise<CompanyDTO> {
    const response = await api.patch<CompanyDTO>(`/companies/${id}`, data);
    return response.data;
  },

  async deleteCompany(id: string): Promise<void> {
    await api.delete(`/companies/${id}`);
  },
};

export default companyService;
