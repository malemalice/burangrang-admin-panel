/**
 * Access Log module types
 * Aligns with backend AccessLog and FindAccessLogsDto
 */

export interface AccessLogUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface AccessLog {
  id: string;
  userId?: string;
  method: string;
  endpoint: string;
  statusCode?: number;
  payload?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  executionTime?: number;
  createdAt: string;
  user?: AccessLogUser;
}

export interface FindAccessLogsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  userId?: string;
  method?: string;
  endpoint?: string;
  dateFrom?: string;
  dateTo?: string;
  payloadSearch?: string;
}

export interface PaginatedAccessLogsResponse {
  data: AccessLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AccessLogStatistics {
  total: number;
  byMethod: Record<string, number>;
  topEndpoints: { endpoint: string; count: number }[];
  recentCount: number;
}
