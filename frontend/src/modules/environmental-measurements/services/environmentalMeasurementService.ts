import api from '@/core/lib/api';
import {
  EnvironmentalMeasurement,
  CreateEnvironmentalMeasurementDTO,
  UpdateEnvironmentalMeasurementDTO,
} from '../types/environmental-measurement.types';
import type { RegulatoryMetricKey, RegulatoryLimitMode } from '../utils/regulatoryLimitComparison';
import { getRegulatoryLimitMode } from '../utils/regulatoryLimitComparison';

export type { RegulatoryLimitMode };

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
  status?: string;
}

export interface MetricRegulatoryLimit {
  limit: number | null;
  mode: RegulatoryLimitMode;
}

export interface EnvironmentalMeasurementRegulatoryLimits {
  lighting: MetricRegulatoryLimit;
  noise: MetricRegulatoryLimit;
  humidity: MetricRegulatoryLimit;
  temperature: MetricRegulatoryLimit;
}

function metricRegulatoryEntry(limit: number | null, metric: RegulatoryMetricKey): MetricRegulatoryLimit {
  return { limit, mode: getRegulatoryLimitMode(metric) };
}

const METRIC_KEYS: RegulatoryMetricKey[] = ['lighting', 'noise', 'humidity', 'temperature'];

/**
 * Accepts current API shape `{ lighting: { limit, mode }, ... }` or legacy flat `{ lighting: 300, ... }`
 * so UI always gets `.limit` on each metric (avoids "Regulatory limit: —" when the server returns numbers).
 */
function normalizeRegulatoryLimitsPayload(data: unknown): EnvironmentalMeasurementRegulatoryLimits {
  const empty = (): EnvironmentalMeasurementRegulatoryLimits => ({
    lighting: metricRegulatoryEntry(null, 'lighting'),
    noise: metricRegulatoryEntry(null, 'noise'),
    humidity: metricRegulatoryEntry(null, 'humidity'),
    temperature: metricRegulatoryEntry(null, 'temperature'),
  });

  if (data === null || data === undefined) {
    return empty();
  }

  let root: unknown = data;
  if (typeof root === 'object' && !Array.isArray(root) && root !== null) {
    const o = root as Record<string, unknown>;
    if (!('lighting' in o) && !('noise' in o) && o.data !== undefined && typeof o.data === 'object') {
      root = o.data;
    }
  }

  if (typeof root !== 'object' || root === null || Array.isArray(root)) {
    return empty();
  }

  const d = root as Record<string, unknown>;
  const out = empty();

  for (const key of METRIC_KEYS) {
    const v = d[key];
    if (v !== null && typeof v === 'object' && !Array.isArray(v) && 'limit' in (v as object)) {
      const entry = v as { limit?: unknown; mode?: unknown };
      const limitNum =
        entry.limit === null || entry.limit === undefined
          ? null
          : parseNullableNumber(entry.limit);
      const mode =
        entry.mode === 'min' || entry.mode === 'max' ? entry.mode : getRegulatoryLimitMode(key);
      out[key] = { limit: limitNum, mode };
      continue;
    }
    if (typeof v === 'number' || typeof v === 'string') {
      out[key] = metricRegulatoryEntry(parseNullableNumber(v), key);
      continue;
    }
    out[key] = metricRegulatoryEntry(null, key);
  }

  return out;
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
    if (params.status) queryParams.append('status', params.status);

    const response = await api.get<EnvironmentalMeasurementsResponse>(`/environmental-measurements?${queryParams.toString()}`);
    return response.data;
  },

  async getRegulatoryLimits(): Promise<EnvironmentalMeasurementRegulatoryLimits> {
    try {
      const response = await api.get<unknown>('/environmental-measurements/regulatory-limits');
      return normalizeRegulatoryLimitsPayload(response.data);
    } catch {
      const [lighting, noise, humidity, temperature] = await Promise.all([
        api.get<{ value: string }>(`/settings/value/${LIMIT_KEYS.lighting}`).then((r) => parseNullableNumber(r.data?.value)).catch(() => null),
        api.get<{ value: string }>(`/settings/value/${LIMIT_KEYS.noise}`).then((r) => parseNullableNumber(r.data?.value)).catch(() => null),
        api.get<{ value: string }>(`/settings/value/${LIMIT_KEYS.humidity}`).then((r) => parseNullableNumber(r.data?.value)).catch(() => null),
        api.get<{ value: string }>(`/settings/value/${LIMIT_KEYS.temperature}`).then((r) => parseNullableNumber(r.data?.value)).catch(() => null),
      ]);

      return {
        lighting: metricRegulatoryEntry(lighting, 'lighting'),
        noise: metricRegulatoryEntry(noise, 'noise'),
        humidity: metricRegulatoryEntry(humidity, 'humidity'),
        temperature: metricRegulatoryEntry(temperature, 'temperature'),
      };
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

  /**
   * Submit a measurement (DRAFT → OPEN)
   */
  async submitMeasurement(id: string): Promise<EnvironmentalMeasurement> {
    const response = await api.patch<EnvironmentalMeasurement>(`/environmental-measurements/${id}/submit`);
    return response.data;
  },

  /**
   * Request approval for a measurement (OPEN → WAITING_APPROVAL)
   */
  async requestApproval(id: string): Promise<EnvironmentalMeasurement> {
    const response = await api.patch<EnvironmentalMeasurement>(`/environmental-measurements/${id}/request-approval`);
    return response.data;
  },
};

export default environmentalMeasurementService;
