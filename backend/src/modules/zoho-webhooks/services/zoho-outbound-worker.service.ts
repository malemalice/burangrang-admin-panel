import {
  ZohoOutboundJobStatusEnum,
  Prisma,
  type ZohoOutboundJob,
} from '@prisma/client';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ZohoDeskApiClient } from './zoho-desk-api.client';

@Injectable()
export class ZohoOutboundWorkerService {
  private readonly logger = new Logger(ZohoOutboundWorkerService.name);
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly zohoDeskApiClient: ZohoDeskApiClient,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async processDueJobs(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    if (!this.getBoolean('ZOHO_SYNC_ENABLED', true)) {
      return;
    }

    this.isRunning = true;

    try {
      const batchSize = Number(
        this.configService.get<string>('ZOHO_WORKER_BATCH_SIZE') || 5,
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
      RETURNING *
    `;

    return result[0] ?? null;
  }

  private async processSingleJob(job: ZohoOutboundJob): Promise<void> {
    const correlationId = job.correlationId || `corr-${randomUUID()}`;
    const attempt = job.attemptCount + 1;

    const requestPayload = (job.requestPayload ?? {}) as Record<
      string,
      unknown
    >;

    const changedFieldsPayload = this.pickAllowedPatchFields(requestPayload);

    if (Object.keys(changedFieldsPayload).length === 0) {
      await this.prisma.zohoOutboundJob.update({
        where: { id: job.id },
        data: {
          status: ZohoOutboundJobStatusEnum.SUCCESS,
          attemptCount: attempt,
          processedAt: new Date(),
          correlationId,
          responsePayload: {
            skipped: true,
            reason: 'no_changed_fields',
          } as Prisma.InputJsonValue,
        },
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

      if (retryable && attempt < maxAttempts) {
        const nextRetryAt = this.computeNextRetryAt(attempt);

        await this.prisma.zohoOutboundJob.update({
          where: { id: job.id },
          data: {
            status: ZohoOutboundJobStatusEnum.FAILED_RETRY,
            attemptCount: attempt,
            nextRetryAt,
            correlationId,
            lastError: this.stringifyError(error),
            responsePayload: this.extractResponseBody(error),
          },
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
          lastError: this.stringifyError(error),
          responsePayload: this.extractResponseBody(error),
        },
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
    payload: Record<string, unknown>,
  ): Record<string, unknown> {
    const next: Record<string, unknown> = {};

    if (
      typeof payload.status === 'string' &&
      payload.status.trim().length > 0
    ) {
      next.status = payload.status;
    }

    if (
      typeof payload.subject === 'string' &&
      payload.subject.trim().length > 0
    ) {
      next.subject = payload.subject;
    }

    if (typeof payload.description === 'string') {
      next.description = payload.description;
    }

    return next;
  }

  private computeNextRetryAt(attempt: number): Date {
    const base = Number(
      this.configService.get<string>('ZOHO_RETRY_BASE_MS') || 2000,
    );
    const cap = Number(
      this.configService.get<string>('ZOHO_RETRY_MAX_MS') || 60000,
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

  private getBoolean(key: string, defaultValue: boolean): boolean {
    const value = this.configService.get<string>(key);
    if (value === undefined || value === null) {
      return defaultValue;
    }

    return value.toLowerCase() === 'true' || value === '1';
  }
}
