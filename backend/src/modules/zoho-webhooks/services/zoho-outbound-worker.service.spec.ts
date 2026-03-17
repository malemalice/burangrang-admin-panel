import { ZohoOutboundJobStatusEnum } from '@prisma/client';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { AccessLogsService } from '../../access-logs/services/access-logs.service';
import { ZohoDeskApiClient } from './zoho-desk-api.client';
import { ZohoConfigService } from './zoho-config.service';
import { ZohoOutboundWorkerService } from './zoho-outbound-worker.service';

describe('ZohoOutboundWorkerService', () => {
  let prismaService: PrismaService;
  let zohoConfigService: ZohoConfigService;
  let zohoDeskApiClient: ZohoDeskApiClient;
  let accessLogsService: AccessLogsService;
  let service: ZohoOutboundWorkerService;

  let queryRawMock: jest.Mock;
  let transactionMock: jest.Mock;
  let outboundUpdateMock: jest.Mock;
  let mappingUpdateMock: jest.Mock;
  let updateRequestMock: jest.Mock;
  let createAccessLogMock: jest.Mock;

  beforeEach(() => {
    queryRawMock = jest.fn();
    transactionMock = jest.fn();
    outboundUpdateMock = jest.fn();
    mappingUpdateMock = jest.fn();
    updateRequestMock = jest.fn();
    createAccessLogMock = jest.fn().mockResolvedValue(undefined);

    prismaService = {
      $queryRaw: queryRawMock,
      $transaction: transactionMock,
      zohoOutboundJob: {
        update: outboundUpdateMock,
      },
      zohoTicketRiskAssessmentMap: {
        update: mappingUpdateMock,
      },
    } as unknown as PrismaService;

    zohoConfigService = {
      getBoolean: jest.fn().mockResolvedValue(true),
      getNumber: jest.fn((key: string) => {
        const map: Record<string, number> = {
          'zoho.worker.batch_size': 1,
          'zoho.retry.base_ms': 1000,
          'zoho.retry.max_ms': 5000,
        };

        return Promise.resolve(map[key] ?? 1);
      }),
    } as unknown as ZohoConfigService;

    zohoDeskApiClient = {
      updateRequest: updateRequestMock,
    } as unknown as ZohoDeskApiClient;

    accessLogsService = {
      createAccessLog: createAccessLogMock,
    } as unknown as AccessLogsService;

    service = new ZohoOutboundWorkerService(
      prismaService,
      zohoConfigService,
      zohoDeskApiClient,
      accessLogsService,
    );
  });

  it('marks job as success, updates mapping, and writes access log on successful patch', async () => {
    const job = {
      id: 'job-1',
      mappingId: 'map-1',
      ticketId: 'z-1',
      targetStatus: 'Resolved',
      requestPayload: {
        status: { id: '3', name: 'Resolved' },
        subject: 'Risk assessment follow-up',
        description: 'Updated from HSE workflow',
        priority: { id: '4', name: 'Urgent' },
        requester: { email_id: 'user@company.com' },
        resolution: {
          content: 'Mitigation completed',
          add_to_linked_requests: false,
        },
        read_only_field: 'must-not-pass',
      },
      status: ZohoOutboundJobStatusEnum.PENDING,
      attemptCount: 0,
      maxAttempts: 6,
      nextRetryAt: new Date(),
      responsePayload: null,
      lastError: null,
      correlationId: 'corr-1',
      processedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    queryRawMock.mockResolvedValueOnce([job]).mockResolvedValueOnce([]);
    updateRequestMock.mockResolvedValue({ ok: true });

    outboundUpdateMock.mockReturnValue(Promise.resolve());
    mappingUpdateMock.mockReturnValue(Promise.resolve());
    transactionMock.mockResolvedValue([]);

    await service.processDueJobs();

    expect(updateRequestMock).toHaveBeenCalledWith(
      'z-1',
      {
        status: { id: '3', name: 'Resolved' },
        subject: 'Risk assessment follow-up',
        description: 'Updated from HSE workflow',
        priority: { id: '4', name: 'Urgent' },
        requester: { email_id: 'user@company.com' },
        resolution: {
          content: 'Mitigation completed',
          add_to_linked_requests: false,
        },
      },
      'corr-1',
    );
    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(createAccessLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PUT',
        endpoint: '/api/v3/requests/z-1',
        statusCode: 200,
        userAgent: 'ZohoOutboundWorker',
        payload: expect.objectContaining({
          result: 'success',
          correlationId: 'corr-1',
          ticketId: 'z-1',
          changedFieldKeys: [
            'subject',
            'description',
            'status',
            'priority',
            'requester',
            'resolution',
          ],
        }),
      }),
    );
  });

  it('skips update request when payload has no writable changed fields and writes access log', async () => {
    const job = {
      id: 'job-skip',
      mappingId: 'map-skip',
      ticketId: 'z-skip',
      targetStatus: null,
      requestPayload: {
        unsupported_field: 'ignored',
        empty_string_field: '   ',
        empty_array_field: [],
      },
      status: ZohoOutboundJobStatusEnum.PENDING,
      attemptCount: 0,
      maxAttempts: 6,
      nextRetryAt: new Date(),
      responsePayload: null,
      lastError: null,
      correlationId: 'corr-skip',
      processedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    queryRawMock.mockResolvedValueOnce([job]).mockResolvedValueOnce([]);
    outboundUpdateMock.mockResolvedValue(undefined);

    await service.processDueJobs();

    expect(updateRequestMock).not.toHaveBeenCalled();
    expect(outboundUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job-skip' },
      }),
    );

    const firstUpdateCall = outboundUpdateMock.mock.calls[0]?.[0] as unknown as {
      data: {
        status: ZohoOutboundJobStatusEnum;
        correlationId: string;
        responsePayload: {
          skipped: boolean;
          reason: string;
        };
      };
    };

    expect(firstUpdateCall.data).toMatchObject({
      status: ZohoOutboundJobStatusEnum.SUCCESS,
      correlationId: 'corr-skip',
      responsePayload: {
        skipped: true,
        reason: 'no_changed_fields',
      },
    });
    expect(createAccessLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: '/api/v3/requests/z-skip',
        statusCode: 204,
        payload: expect.objectContaining({
          result: 'skipped',
          changedFieldKeys: [],
        }),
      }),
    );
  });

  it('schedules retry for retryable error before max attempts and writes access log', async () => {
    const job = {
      id: 'job-2',
      mappingId: 'map-2',
      ticketId: 'z-2',
      targetStatus: 'On Progress',
      requestPayload: { status: 'On Progress' },
      status: ZohoOutboundJobStatusEnum.PENDING,
      attemptCount: 0,
      maxAttempts: 3,
      nextRetryAt: new Date(),
      responsePayload: null,
      lastError: null,
      correlationId: 'corr-2',
      processedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    queryRawMock.mockResolvedValueOnce([job]).mockResolvedValueOnce([]);

    const retryableError = Object.assign(new Error('rate limit'), {
      statusCode: 429,
      responseBody: { message: 'too many requests' },
    });

    updateRequestMock.mockRejectedValue(retryableError);
    outboundUpdateMock.mockResolvedValue(undefined);

    await service.processDueJobs();

    expect(outboundUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job-2' },
      }),
    );
    expect(createAccessLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: '/api/v3/requests/z-2',
        statusCode: 429,
        payload: expect.objectContaining({
          result: 'retry_scheduled',
          errorMessage: 'rate limit',
        }),
      }),
    );
  });

  it('moves job to dead-letter when max attempts exhausted and writes access log', async () => {
    const job = {
      id: 'job-3',
      mappingId: 'map-3',
      ticketId: 'z-3',
      targetStatus: 'Closed',
      requestPayload: { status: 'Closed' },
      status: ZohoOutboundJobStatusEnum.FAILED_RETRY,
      attemptCount: 2,
      maxAttempts: 3,
      nextRetryAt: new Date(),
      responsePayload: null,
      lastError: null,
      correlationId: 'corr-3',
      processedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    queryRawMock.mockResolvedValueOnce([job]).mockResolvedValueOnce([]);

    const nonRetryableError = Object.assign(new Error('bad request'), {
      statusCode: 400,
      responseBody: { message: 'invalid status' },
    });

    updateRequestMock.mockRejectedValue(nonRetryableError);
    outboundUpdateMock.mockResolvedValue(undefined);

    await service.processDueJobs();

    expect(outboundUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job-3' },
      }),
    );
    expect(createAccessLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: '/api/v3/requests/z-3',
        statusCode: 400,
        payload: expect.objectContaining({
          result: 'dead_letter',
          errorMessage: 'bad request',
        }),
      }),
    );
  });
});
