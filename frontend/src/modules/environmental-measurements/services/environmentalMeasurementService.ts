import api from '@/core/lib/api';
import {
  EnvironmentalMeasurement,
  CreateEnvironmentalMeasurementDTO,
  UpdateEnvironmentalMeasurementDTO,
} from '../types/environmental-measurement.types';

export interface EnvironmentalMeasurementsResponse {
  data: EnvironmentalMeasurement[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

interface FetchMeasurementsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  roomId?: string;
  startDate?: string;
  endDate?: string;
}

export interface EnvironmentalMeasurementRegulatoryLimits {
  lighting: number | null;
  noise: number | null;
  humidity: number | null;
  temperature: number | null;
}

const LIMIT_KEYS = {
  lighting: 'environmental_measurements.regulatory_limit.lighting',
  noise: 'environmental_measurements.regulatory_limit.noise',
  humidity: 'environmental_measurements.regulatory_limit.humidity',
  temperature: 'environmental_measurements.regulatory_limit.temperature',
} as const;

function parseNullableNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  const str = String(raw);
  const num = Number.parseFloat(str);
  return Number.isFinite(num) ? num : null;
}

const environmentalMeasurementService = {
  /**
   * Fetch paginated list of environmental measurements
   */
  async getMeasurements(params: FetchMeasurementsParams = {}): Promise<EnvironmentalMeasurementsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.roomId) queryParams.append('roomId', params.roomId);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const response = await api.get<EnvironmentalMeasurementsResponse>(`/environmental-measurements?${queryParams.toString()}`);
    return response.data;
  },

  async getRegulatoryLimits(): Promise<EnvironmentalMeasurementRegulatoryLimits> {
    try {
      const response = await api.get<EnvironmentalMeasurementRegulatoryLimits>('/environmental-measurements/regulatory-limits');
      return response.data;
    } catch {
      const [lighting, noise, humidity, temperature] = await Promise.all([
        api.get<{ value: string }>(`/settings/value/${LIMIT_KEYS.lighting}`).then((r) => parseNullableNumber(r.data?.value)).catch(() => null),
        api.get<{ value: string }>(`/settings/value/${LIMIT_KEYS.noise}`).then((r) => parseNullableNumber(r.data?.value)).catch(() => null),
        api.get<{ value: string }>(`/settings/value/${LIMIT_KEYS.humidity}`).then((r) => parseNullableNumber(r.data?.value)).catch(() => null),
        api.get<{ value: string }>(`/settings/value/${LIMIT_KEYS.temperature}`).then((r) => parseNullableNumber(r.data?.value)).catch(() => null),
      ]);

      return { lighting, noise, humidity, temperature };
    }
  },

  /**
   * Fetch a single environmental measurement by ID
   */
  async getMeasurement(id: string): Promise<EnvironmentalMeasurement> {
    const response = await api.get<EnvironmentalMeasurement>(`/environmental-measurements/${id}`);
    return response.data;
  },

  /**
   * Create a new environmental measurement
   */
  async createMeasurement(data: CreateEnvironmentalMeasurementDTO): Promise<EnvironmentalMeasurement> {
    const response = await api.post<EnvironmentalMeasurement>('/environmental-measurements', data);
    return response.data;
  },

  /**
   * Update an existing environmental measurement
   */
  async updateMeasurement(id: string, data: UpdateEnvironmentalMeasurementDTO): Promise<EnvironmentalMeasurement> {
    const response = await api.patch<EnvironmentalMeasurement>(`/environmental-measurements/${id}`, data);
    return response.data;
  },

  /**
   * Delete an environmental measurement
   */
  async deleteMeasurement(id: string): Promise<void> {
    await api.delete(`/environmental-measurements/${id}`);
  },
};

export default environmentalMeasurementService;
