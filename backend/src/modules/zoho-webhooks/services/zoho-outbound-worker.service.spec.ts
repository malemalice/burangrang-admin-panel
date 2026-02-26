import { ZohoOutboundJobStatusEnum } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ZohoDeskApiClient } from './zoho-desk-api.client';
import { ZohoOutboundWorkerService } from './zoho-outbound-worker.service';

describe('ZohoOutboundWorkerService', () => {
  let prismaService: PrismaService;
  let configService: ConfigService;
  let zohoDeskApiClient: ZohoDeskApiClient;
  let service: ZohoOutboundWorkerService;

  let queryRawMock: jest.Mock;
  let transactionMock: jest.Mock;
  let outboundUpdateMock: jest.Mock;
  let mappingUpdateMock: jest.Mock;
  let updateRequestMock: jest.Mock;

  beforeEach(() => {
    queryRawMock = jest.fn();
    transactionMock = jest.fn();
    outboundUpdateMock = jest.fn();
    mappingUpdateMock = jest.fn();
    updateRequestMock = jest.fn();

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

    configService = {
      get: jest.fn((key: string) => {
        const map: Record<string, string> = {
          ZOHO_SYNC_ENABLED: 'true',
          ZOHO_WORKER_BATCH_SIZE: '1',
          ZOHO_RETRY_BASE_MS: '1000',
          ZOHO_RETRY_MAX_MS: '5000',
        };

        return map[key];
      }),
    } as unknown as ConfigService;

    zohoDeskApiClient = {
      updateRequest: updateRequestMock,
    } as unknown as ZohoDeskApiClient;

    service = new ZohoOutboundWorkerService(
      prismaService,
      configService,
      zohoDeskApiClient,
    );
  });

  it('marks job as success and updates mapping on successful patch', async () => {
    const job = {
      id: 'job-1',
      mappingId: 'map-1',
      ticketId: 'z-1',
      targetStatus: 'Resolved',
      requestPayload: { status: 'Resolved' },
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
      { status: 'Resolved' },
      'corr-1',
    );
    expect(transactionMock).toHaveBeenCalledTimes(1);
  });

  it('schedules retry for retryable error before max attempts', async () => {
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
  });

  it('moves job to dead-letter when max attempts exhausted', async () => {
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
  });
});
