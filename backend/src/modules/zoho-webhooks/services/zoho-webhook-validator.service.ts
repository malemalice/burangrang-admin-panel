import { Prisma } from '@prisma/client';
import { Injectable, Logger } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ZohoWebhookDto } from '../dto/zoho-webhook.dto';

interface CreateWebhookLogParams {
  requestId: string;
  eventType: string;
  eventKey: string;
  ticketId?: string;
  correlationId?: string;
  status: 'RECEIVED' | 'PROCESSED' | 'IGNORED_DUPLICATE' | 'FAILED';
  payload: ZohoWebhookDto;
  errorMessage?: string;
  errorSummary?: string;
}

@Injectable()
export class ZohoWebhookValidatorService {
  private readonly logger = new Logger(ZohoWebhookValidatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  resolveRequestId(requestId: string | undefined): string {
    return requestId?.trim() || `generated-${randomUUID()}`;
  }

  resolveCorrelationId(correlationId: string | undefined): string {
    return correlationId?.trim() || `corr-${randomUUID()}`;
  }

  buildEventKey(
    eventType: string,
    ticketId: string,
    requestIdOrTimestamp: string,
    payload: ZohoWebhookDto,
  ): string {
    const payloadFingerprint = createHash('sha256')
      .update(JSON.stringify(payload ?? {}))
      .digest('hex');

    return createHash('sha256')
      .update(
        `${eventType}|${ticketId}|${requestIdOrTimestamp}|${payloadFingerprint}`,
      )
      .digest('hex');
  }

  async isDuplicateByRequestId(requestId: string): Promise<boolean> {
    const existing = await this.prisma.tZohoWebhookLogs.findUnique({
      where: { requestId },
      select: { id: true },
    });

    return Boolean(existing);
  }

  async isDuplicateByEventKey(eventKey: string): Promise<boolean> {
    const existing = await this.prisma.tZohoWebhookLogs.findUnique({
      where: { eventKey },
      select: { id: true },
    });

    return Boolean(existing);
  }

  async hasEntityMapping(ticketId: string): Promise<boolean> {
    const mapping = await this.prisma.zohoTicketRiskAssessmentMap.findUnique({
      where: { zohoTicketId: ticketId },
      select: { id: true },
    });

    return Boolean(mapping);
  }

  async createWebhookLog(params: CreateWebhookLogParams): Promise<void> {
    await this.prisma.tZohoWebhookLogs.create({
      data: {
        requestId: params.requestId,
        eventType: params.eventType,
        eventKey: params.eventKey,
        ticketId: params.ticketId,
        correlationId: params.correlationId,
        status: params.status,
        payload: params.payload as unknown as Prisma.InputJsonValue,
        payloadSanitized: this.sanitizePayload(params.payload),
        errorMessage: params.errorMessage,
        errorSummary: params.errorSummary,
        processedAt: new Date(),
      },
    });
  }

  async updateWebhookLog(
    eventKey: string,
    status: 'PROCESSED' | 'IGNORED_DUPLICATE' | 'FAILED',
    params?: {
      errorMessage?: string;
      errorSummary?: string;
    },
  ): Promise<void> {
    await this.prisma.tZohoWebhookLogs.update({
      where: { eventKey },
      data: {
        status,
        errorMessage: params?.errorMessage,
        errorSummary: params?.errorSummary,
        processedAt: new Date(),
      },
    });
  }

  private sanitizePayload(payload: ZohoWebhookDto): Prisma.InputJsonValue {
    const cloned = JSON.parse(JSON.stringify(payload ?? {})) as Record<
      string,
      unknown
    >;

    if (typeof cloned.authorization === 'string') {
      cloned.authorization = '[REDACTED]';
    }

    return cloned as Prisma.InputJsonValue;
  }

  logStructured(fields: Record<string, unknown>): void {
    this.logger.log(JSON.stringify(fields));
  }
}
