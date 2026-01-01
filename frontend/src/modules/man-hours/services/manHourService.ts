import api from '@/core/lib/api';
import {
  ManHour,
  CreateManHourDTO,
  UpdateManHourDTO,
  ManHourReport,
  ManHourGroup,
  Month,
} from '../types/man-hour.types';

export interface ManHoursResponse {
  data: ManHour[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

interface FetchManHoursParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  month?: Month;
  year?: number;
  group?: ManHourGroup;
}

interface FetchReportParams {
  startYear: number;
  endYear: number;
  group?: ManHourGroup;
}

const manHourService = {
  /**
   * Fetch paginated list of man hours
   */
  async getManHours(params: FetchManHoursParams = {}): Promise<ManHoursResponse> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.month) queryParams.append('month', params.month);
    if (params.year) queryParams.append('year', params.year.toString());
    if (params.group) queryParams.append('group', params.group);

    const response = await api.get<ManHoursResponse>(`/man-hours?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Fetch a single man hour by ID
   */
  async getManHour(id: string): Promise<ManHour> {
    const response = await api.get<ManHour>(`/man-hours/${id}`);
    return response.data;
  },

  /**
   * Create a new man hour
   */
  async createManHour(data: CreateManHourDTO): Promise<ManHour> {
    const response = await api.post<ManHour>('/man-hours', data);
    return response.data;
  },

  /**
   * Update an existing man hour
   */
  async updateManHour(id: string, data: UpdateManHourDTO): Promise<ManHour> {
    const response = await api.patch<ManHour>(`/man-hours/${id}`, data);
    return response.data;
  },

  /**
   * Delete a man hour
   */
  async deleteManHour(id: string): Promise<void> {
    await api.delete(`/man-hours/${id}`);
  },

  /**
   * Get aggregated report data
   */
  async getReport(params: FetchReportParams): Promise<ManHourReport> {
    const queryParams = new URLSearchParams();
    queryParams.append('startYear', params.startYear.toString());
    queryParams.append('endYear', params.endYear.toString());
    if (params.group) queryParams.append('group', params.group);

    const response = await api.get<ManHourReport>(`/man-hours/report?${queryParams.toString()}`);
    return response.data;
  },
};

export default manHourService;
