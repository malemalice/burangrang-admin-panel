import {
  ZohoOutboundJobStatusEnum,
  Prisma,
  type ZohoOutboundJob,
} from '@prisma/client';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { AccessLogsService } from '../../access-logs/services/access-logs.service';
import { SETTINGS_KEYS } from '../../settings/constants/settings-keys';
import {
  SDP_WRITABLE_FIELDS,
  type SdpRequestPayload,
} from '../types/sdp-request-payload.types';
import { ZohoDeskApiClient } from './zoho-desk-api.client';
import { ZohoConfigService } from './zoho-config.service';

@Injectable()
export class ZohoOutboundWorkerService {
  private readonly logger = new Logger(ZohoOutboundWorkerService.name);
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly zohoConfigService: ZohoConfigService,
    private readonly zohoDeskApiClient: ZohoDeskApiClient,
    private readonly accessLogsService: AccessLogsService,
  ) { }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async processDueJobs(): Promise<void> {
    if (process.env.DISABLE_SCHEDULERS === 'true') {
      return;
    }
    if (this.isRunning) {
      return;
    }

    const syncEnabled = await this.zohoConfigService.getBoolean(
      SETTINGS_KEYS.ZOHO_SYNC_ENABLED,
      true,
    );
    if (!syncEnabled) {
      return;
    }

    this.isRunning = true;

    try {
      const batchSize = await this.zohoConfigService.getNumber(
        SETTINGS_KEYS.ZOHO_WORKER_BATCH_SIZE,
        5,
      );

      for (let i = 0; i < batchSize; i += 1) {
        const claimed = await this.claimNextJob();
        if (!claimed) {
          break;
        }

        await this.processSingleJob(claimed);
      }
    } finally {
      this.isRunning = false;
    }
  }

  private async claimNextJob(): Promise<ZohoOutboundJob | null> {
    const now = new Date();

    const result = await this.prisma.$queryRaw<ZohoOutboundJob[]>`
      UPDATE t_zoho_outbound_jobs AS j
      SET
        status = ${ZohoOutboundJobStatusEnum.PROCESSING}::"ZohoOutboundJobStatusEnum",
        updated_at = NOW()
      WHERE j.id = (
        SELECT id
        FROM t_zoho_outbound_jobs
        WHERE status IN (
          ${ZohoOutboundJobStatusEnum.PENDING}::"ZohoOutboundJobStatusEnum",
          ${ZohoOutboundJobStatusEnum.FAILED_RETRY}::"ZohoOutboundJobStatusEnum"
        )
          AND next_retry_at <= ${now}
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      RETURNING
        j.id,
        j.mapping_id AS "mappingId",
        j.ticket_id AS "ticketId",
        j.target_status AS "targetStatus",
        j.request_payload AS "requestPayload",
        j.response_payload AS "responsePayload",
        j.status,
        j.attempt_count AS "attemptCount",
        j.max_attempts AS "maxAttempts",
        j.next_retry_at AS "nextRetryAt",
        j.last_error AS "lastError",
        j.correlation_id AS "correlationId",
        j.processed_at AS "processedAt",
        j.created_at AS "createdAt",
        j.updated_at AS "updatedAt"
    `;

    return result[0] ?? null;
  }

  private async processSingleJob(job: ZohoOutboundJob): Promise<void> {
    const correlationId = job.correlationId || `corr-${randomUUID()}`;
    const attempt = job.attemptCount + 1;
    const startedAt = Date.now();
    const endpoint = `/api/v3/requests/${job.ticketId}`;

    const requestPayload = (job.requestPayload ?? {}) as SdpRequestPayload;
    const changedFieldsPayload = this.pickAllowedPatchFields(requestPayload);

    if (Object.keys(changedFieldsPayload).length === 0) {
      const skippedResponse = {
        skipped: true,
        reason: 'no_changed_fields',
      } as Prisma.InputJsonValue;

      await this.prisma.zohoOutboundJob.update({
        where: { id: job.id },
        data: {
          status: ZohoOutboundJobStatusEnum.SUCCESS,
          attemptCount: attempt,
          processedAt: new Date(),
          correlationId,
          responsePayload: skippedResponse,
        },
      });

      await this.logOutboundAccess({
        method: 'PUT',
        endpoint,
        statusCode: 204,
        correlationId,
        job,
        attempt,
        result: 'skipped',
        changedFieldsPayload,
        responsePayload: skippedResponse,
        startedAt,
      });
      return;
    }

    try {
      const response = await this.zohoDeskApiClient.updateRequest(
        job.ticketId,
        changedFieldsPayload,
        correlationId,
      );

      await this.prisma.$transaction([
        this.prisma.zohoOutboundJob.update({
          where: { id: job.id },
          data: {
            status: ZohoOutboundJobStatusEnum.SUCCESS,
            attemptCount: attempt,
            processedAt: new Date(),
            correlationId,
            responsePayload: response as Prisma.InputJsonValue,
            lastError: null,
          },
        }),
        this.prisma.zohoTicketRiskAssessmentMap.update({
          where: { id: job.mappingId },
          data: {
            lastZohoStatus: job.targetStatus,
          },
        }),
      ]);

      await this.logOutboundAccess({
        method: 'PUT',
        endpoint,
        statusCode: 200,
        correlationId,
        job,
        attempt,
        result: 'success',
        changedFieldsPayload,
        responsePayload: response,
        startedAt,
      });

      this.logger.log(
        JSON.stringify({
          correlationId,
          jobId: job.id,
          ticketId: job.ticketId,
          attempt,
          result: 'success',
        }),
      );
    } catch (error) {
      const statusCode = this.readStatusCode(error);
      const retryable = this.isRetryable(statusCode, error);
      const maxAttempts = job.maxAttempts;
      const responseBody = this.extractResponseBody(error);
      const errorMessage = this.stringifyError(error);

      if (retryable && attempt < maxAttempts) {
        const nextRetryAt = await this.computeNextRetryAt(attempt);

        await this.prisma.zohoOutboundJob.update({
          where: { id: job.id },
          data: {
            status: ZohoOutboundJobStatusEnum.FAILED_RETRY,
            attemptCount: attempt,
            nextRetryAt,
            correlationId,
            lastError: errorMessage,
            responsePayload: responseBody,
          },
        });

        await this.logOutboundAccess({
          method: 'PUT',
          endpoint,
          statusCode: statusCode ?? 500,
          correlationId,
          job,
          attempt,
          result: 'retry_scheduled',
          changedFieldsPayload,
          responsePayload: responseBody,
          errorMessage,
          startedAt,
          nextRetryAt,
        });

        this.logger.warn(
          JSON.stringify({
            correlationId,
            jobId: job.id,
            ticketId: job.ticketId,
            attempt,
            statusCode,
            result: 'retry_scheduled',
            nextRetryAt: nextRetryAt.toISOString(),
          }),
        );
        return;
      }

      await this.prisma.zohoOutboundJob.update({
        where: { id: job.id },
        data: {
          status: ZohoOutboundJobStatusEnum.FAILED_DEAD_LETTER,
          attemptCount: attempt,
          processedAt: new Date(),
          correlationId,
          lastError: errorMessage,
          responsePayload: responseBody,
        },
      });

      await this.logOutboundAccess({
        method: 'PUT',
        endpoint,
        statusCode: statusCode ?? 500,
        correlationId,
        job,
        attempt,
        result: 'dead_letter',
        changedFieldsPayload,
        responsePayload: responseBody,
        errorMessage,
        startedAt,
      });

      this.logger.error(
        JSON.stringify({
          correlationId,
          jobId: job.id,
          ticketId: job.ticketId,
          attempt,
          statusCode,
          result: 'dead_letter',
        }),
      );
    }
  }

  private pickAllowedPatchFields(
    payload: SdpRequestPayload,
  ): SdpRequestPayload {
    const next: SdpRequestPayload = {};

    for (const field of SDP_WRITABLE_FIELDS) {
      const value = payload[field];

      if (value === undefined || value === null) {
        continue;
      }

      if (typeof value === 'string' && value.trim().length === 0) {
        continue;
      }

      if (Array.isArray(value) && value.length === 0) {
        continue;
      }

      Object.assign(next, {
        [field]: value,
      });
    }

    return next;
  }

  private async logOutboundAccess(params: {
    method: string;
    endpoint: string;
    statusCode: number;
    correlationId: string;
    job: ZohoOutboundJob;
    attempt: number;
    result: 'success' | 'retry_scheduled' | 'dead_letter' | 'skipped';
    changedFieldsPayload: SdpRequestPayload;
    responsePayload?: Record<string, unknown> | Prisma.InputJsonValue;
    errorMessage?: string;
    startedAt: number;
    nextRetryAt?: Date;
  }): Promise<void> {
    await this.accessLogsService.createAccessLog({
      method: params.method,
      endpoint: params.endpoint,
      statusCode: params.statusCode,
      payload: {
        source: 'zoho_outbound_worker',
        correlationId: params.correlationId,
        jobId: params.job.id,
        mappingId: params.job.mappingId,
        ticketId: params.job.ticketId,
        attempt: params.attempt,
        maxAttempts: params.job.maxAttempts,
        targetStatus: params.job.targetStatus,
        result: params.result,
        changedFieldKeys: Object.keys(params.changedFieldsPayload),
        requestPayload: params.changedFieldsPayload as unknown as Record<string, unknown>,
        responsePayload: this.toAccessLogRecord(params.responsePayload),
        errorMessage: params.errorMessage,
        nextRetryAt: params.nextRetryAt?.toISOString(),
      },
      userAgent: 'ZohoOutboundWorker',
      executionTime: Date.now() - params.startedAt,
    });
  }

  private toAccessLogRecord(
    payload?: Record<string, unknown> | Prisma.InputJsonValue,
  ): Record<string, unknown> | undefined {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return undefined;
    }

    return payload as Record<string, unknown>;
  }

  private async computeNextRetryAt(attempt: number): Promise<Date> {
    const base = await this.zohoConfigService.getNumber(
      SETTINGS_KEYS.ZOHO_RETRY_BASE_MS,
      2000,
    );
    const cap = await this.zohoConfigService.getNumber(
      SETTINGS_KEYS.ZOHO_RETRY_MAX_MS,
      60000,
    );
    const exponential = Math.min(cap, base * 2 ** Math.max(0, attempt - 1));
    const jitter = Math.floor(
      Math.random() * Math.max(1, Math.floor(exponential * 0.25)),
    );
    return new Date(Date.now() + exponential + jitter);
  }

  private isRetryable(statusCode: number | null, error: unknown): boolean {
    if (statusCode === 429) {
      return true;
    }

    if (statusCode !== null && statusCode >= 500) {
      return true;
    }

    const message = this.stringifyError(error).toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('fetch failed')
    );
  }

  private readStatusCode(error: unknown): number | null {
    if (
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      typeof (error as { statusCode: unknown }).statusCode === 'number'
    ) {
      return (error as { statusCode: number }).statusCode;
    }

    return null;
  }

  private extractResponseBody(error: unknown): Prisma.InputJsonValue {
    if (
      typeof error === 'object' &&
      error !== null &&
      'responseBody' in error
    ) {
      const responseBody = (error as { responseBody?: unknown }).responseBody;
      if (responseBody && typeof responseBody === 'object') {
        return responseBody as Prisma.InputJsonValue;
      }
    }

    return {
      message: this.stringifyError(error),
    } as Prisma.InputJsonValue;
  }

  private stringifyError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'Unknown error';
  }
}
