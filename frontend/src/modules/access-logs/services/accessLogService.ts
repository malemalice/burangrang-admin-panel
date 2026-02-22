import api from '@/core/lib/api';
import type {
  AccessLog,
  FindAccessLogsParams,
  PaginatedAccessLogsResponse,
  AccessLogStatistics,
} from '../types/access-log.types';

const accessLogService = {
  getAccessLogs: async (
    params: FindAccessLogsParams
  ): Promise<PaginatedAccessLogsResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.set('page', String(params.page ?? 1));
    queryParams.set('limit', String(params.limit ?? 10));
    if (params.sortBy) {
      queryParams.set('sortBy', params.sortBy);
      queryParams.set('sortOrder', params.sortOrder ?? 'desc');
    }
    if (params.userId) queryParams.set('userId', params.userId);
    if (params.method) queryParams.set('method', params.method);
    if (params.endpoint) queryParams.set('endpoint', params.endpoint);
    if (params.dateFrom) queryParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.set('dateTo', params.dateTo);
    if (params.payloadSearch) queryParams.set('payloadSearch', params.payloadSearch);

    const response = await api.get(`/access-logs?${queryParams.toString()}`);
    return {
      data: response.data.data,
      meta: response.data.meta,
    };
  },

  getAccessLogById: async (id: string): Promise<AccessLog> => {
    const response = await api.get(`/access-logs/${id}`);
    return response.data;
  },

  getStatistics: async (): Promise<AccessLogStatistics> => {
    const response = await api.get('/access-logs/statistics');
    return response.data;
  },
};

export default accessLogService;
