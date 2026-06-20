import api from '@/core/lib/api';

export interface OutboundJob {
  id: string;
  ticketId: string;
  targetStatus: string;
  status: string;
  attemptCount: number;
  maxAttempts: number;
  lastError: string | null;
  nextRetryAt: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt: string | null;
  mapping: {
    hseTaskId: string;
    zohoTicketNumber: string | null;
  } | null;
}

export interface WebhookLog {
  id: string;
  eventType: string;
  ticketId: string | null;
  status: string;
  errorSummary: string | null;
  correlationId: string | null;
  createdAt: string;
  processedAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number };
}

const zohoMonitorService = {
  getJobs: async (params: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResult<OutboundJob>> => {
    const q = new URLSearchParams();
    q.set('page', String(params.page ?? 1));
    q.set('limit', String(params.limit ?? 20));
    if (params.status) q.set('status', params.status);
    const response = await api.get(`/integrations/zoho/jobs?${q.toString()}`);
    return response.data as PaginatedResult<OutboundJob>;
  },

  retryJob: async (id: string): Promise<void> => {
    await api.post(`/integrations/zoho/jobs/${id}/retry`);
  },

  getWebhookLogs: async (params: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResult<WebhookLog>> => {
    const q = new URLSearchParams();
    q.set('page', String(params.page ?? 1));
    q.set('limit', String(params.limit ?? 20));
    if (params.status) q.set('status', params.status);
    const response = await api.get(`/integrations/zoho/webhook-logs?${q.toString()}`);
    return response.data as PaginatedResult<WebhookLog>;
  },
};

export default zohoMonitorService;
