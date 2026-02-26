import { GeneralStatusEnum, Prisma } from '@prisma/client';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ZOHO_EVENT_TYPES } from '../constants/zoho-event-types';
import { ZohoTicketAddDataDto } from '../dto/zoho-ticket-add.dto';
import {
  ZohoWebhookDto,
  ZohoWebhookResponseDto,
} from '../dto/zoho-webhook.dto';
import { ZohoWebhookValidatorService } from './zoho-webhook-validator.service';

@Injectable()
export class ZohoWebhookService {
  private readonly logger = new Logger(ZohoWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly validatorService: ZohoWebhookValidatorService,
  ) {}

  async receiveWebhook(
    payload: ZohoWebhookDto,
    eventTypeHeader: string | undefined,
    requestIdHeader: string | undefined,
    correlationIdHeader: string | undefined,
    isLegacyRoute: boolean,
  ): Promise<ZohoWebhookResponseDto> {
    const eventType = eventTypeHeader?.trim() || 'UNKNOWN';
    const requestId = this.validatorService.resolveRequestId(requestIdHeader);
    const correlationId =
      this.validatorService.resolveCorrelationId(correlationIdHeader);
    const ticketData = this.extractTicketData(payload);
    const requestTimestamp = this.extractRequestTimestamp(payload);
    const eventKeySeed = requestIdHeader?.trim() || requestTimestamp;

    if (!ticketData.id) {
      const invalidEventKey = this.validatorService.buildEventKey(
        eventType,
        'NO_TICKET_ID',
        eventKeySeed,
        payload,
      );

      await this.tryCreateWebhookLogOrIgnoreUnique({
        requestId,
        eventType,
        eventKey: invalidEventKey,
        ticketId: undefined,
        correlationId,
        status: 'FAILED',
        payload,
        errorSummary: 'Missing ticket id on inbound payload',
      });

      this.validatorService.logStructured({
        correlationId,
        requestId,
        eventType,
        eventKey: invalidEventKey,
        result: 'ignored_missing_ticket_id',
      });

      return {
        status: 'ok',
        message: 'Webhook accepted (missing ticket id ignored)',
        correlationId,
      };
    }

    const eventKey = this.validatorService.buildEventKey(
      eventType,
      ticketData.id,
      eventKeySeed,
      payload,
    );

    if (await this.validatorService.isDuplicateByRequestId(requestId)) {
      this.validatorService.logStructured({
        correlationId,
        requestId,
        eventType,
        eventKey,
        zohoTicketId: ticketData.id,
        result: 'ignored_duplicate_request',
      });

      return {
        status: 'ok',
        message: 'Webhook accepted (duplicate request ignored)',
        correlationId,
      };
    }

    if (await this.validatorService.isDuplicateByEventKey(eventKey)) {
      this.validatorService.logStructured({
        correlationId,
        requestId,
        eventType,
        eventKey,
        zohoTicketId: ticketData.id,
        result: 'ignored_duplicate_event',
      });

      return {
        status: 'ok',
        message: 'Webhook accepted (duplicate event ignored)',
        correlationId,
      };
    }

    const inserted = await this.tryCreateWebhookLogOrIgnoreUnique({
      requestId,
      eventType,
      eventKey,
      ticketId: ticketData.id,
      correlationId,
      status: 'RECEIVED',
      payload,
    });

    if (!inserted) {
      this.validatorService.logStructured({
        correlationId,
        requestId,
        eventType,
        eventKey,
        zohoTicketId: ticketData.id,
        result: 'ignored_duplicate_insert_race',
      });

      return {
        status: 'ok',
        message: 'Webhook accepted (duplicate event ignored)',
        correlationId,
      };
    }

    setImmediate(() => {
      void this.processInboundAsync({
        payload,
        eventType,
        requestId,
        eventKey,
        correlationId,
        ticketData,
        isLegacyRoute,
      });
    });

    return {
      status: 'ok',
      message: 'Webhook accepted for asynchronous processing',
      correlationId,
    };
  }

  private async processInboundAsync(params: {
    payload: ZohoWebhookDto;
    eventType: string;
    requestId: string;
    eventKey: string;
    correlationId: string;
    ticketData: ZohoTicketAddDataDto;
    isLegacyRoute: boolean;
  }): Promise<void> {
    const {
      payload,
      eventType,
      requestId,
      eventKey,
      correlationId,
      ticketData,
      isLegacyRoute,
    } = params;

    try {
      if (eventType !== ZOHO_EVENT_TYPES.TICKET_ADD) {
        await this.validatorService.updateWebhookLog(eventKey, 'PROCESSED', {
          errorSummary: `Ignored unsupported event type: ${eventType}`,
        });

        this.validatorService.logStructured({
          correlationId,
          requestId,
          eventType,
          eventKey,
          zohoTicketId: ticketData.id,
          result: 'ignored_event_type',
        });
        return;
      }

      if (await this.validatorService.hasEntityMapping(ticketData.id)) {
        await this.validatorService.updateWebhookLog(
          eventKey,
          'IGNORED_DUPLICATE',
          {
            errorSummary: `Duplicate entity mapping for Zoho ticket ${ticketData.id}`,
          },
        );

        this.validatorService.logStructured({
          correlationId,
          requestId,
          eventType,
          eventKey,
          zohoTicketId: ticketData.id,
          result: 'ignored_duplicate_entity',
        });
        return;
      }

      const departmentId = await this.resolveDepartmentId(
        ticketData.departmentId,
      );
      const integrationUserId = await this.resolveIntegrationUserId();
      const initialStatus = this.resolveInboundDefaultStatus();
      const generatedCode = this.generateRiskAssessmentCode(
        ticketData.ticketNumber,
      );
      const mappedDescription = this.composeDescription(ticketData);
      const actionPlan = this.composeActionPlan(ticketData);

      const createdRiskAssessment = await this.prisma.riskAssessment.create({
        data: {
          code: generatedCode,
          description: mappedDescription,
          departmentId,
          assessmentDate: new Date(),
          createdBy: integrationUserId,
          status: initialStatus,
          isActive: true,
          actionPlan,
        },
      });

      await this.prisma.zohoTicketRiskAssessmentMap.create({
        data: {
          zohoTicketId: ticketData.id,
          zohoTicketNumber: ticketData.ticketNumber,
          hseTaskId: createdRiskAssessment.id,
          lastZohoStatus: null,
          lastHseStatus: createdRiskAssessment.status,
          rawPayload: payload as unknown as Prisma.InputJsonValue,
        },
      });

      await this.validatorService.updateWebhookLog(eventKey, 'PROCESSED');

      this.validatorService.logStructured({
        correlationId,
        requestId,
        eventType,
        eventKey,
        zohoTicketId: ticketData.id,
        hseTaskId: createdRiskAssessment.id,
        legacyRoute: isLegacyRoute,
        result: 'processed',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await this.validatorService.updateWebhookLog(eventKey, 'FAILED', {
        errorMessage: message,
        errorSummary: message.slice(0, 512),
      });

      this.logger.error(
        JSON.stringify({
          correlationId,
          requestId,
          eventType,
          eventKey,
          zohoTicketId: ticketData.id,
          result: 'failed',
          error: message,
        }),
      );
    }
  }

  private extractTicketData(payload: ZohoWebhookDto): ZohoTicketAddDataDto {
    const data = payload.data ?? {};

    return {
      id: this.readStringField(data.id)?.trim() ?? '',
      ticketNumber: this.readStringField(data.ticketNumber),
      subject: this.readStringField(data.subject),
      description: this.readStringField(data.description),
      priority: this.readStringField(data.priority),
      departmentId: this.readStringField(data.departmentId),
    };
  }

  private extractRequestTimestamp(payload: ZohoWebhookDto): string {
    const meta = payload.meta ?? {};
    const timestamp = meta.timestamp;
    if (typeof timestamp === 'string' && timestamp.trim().length > 0) {
      return timestamp.trim();
    }

    return 'NO_TIMESTAMP';
  }

  private async resolveDepartmentId(
    zohoDepartmentId: string | undefined,
  ): Promise<string> {
    if (zohoDepartmentId) {
      const internalDepartment = await this.prisma.department.findFirst({
        where: {
          id: zohoDepartmentId,
          isActive: true,
        },
        select: { id: true },
      });

      if (internalDepartment?.id) {
        return internalDepartment.id;
      }
    }

    const fallbackDepartmentId = this.configService
      .get<string>('ZOHO_DEFAULT_DEPARTMENT_ID')
      ?.trim();

    if (fallbackDepartmentId) {
      const fallbackDepartment = await this.prisma.department.findFirst({
        where: {
          id: fallbackDepartmentId,
          isActive: true,
        },
        select: { id: true },
      });

      if (fallbackDepartment?.id) {
        return fallbackDepartment.id;
      }
    }

    throw new Error(
      'Unable to resolve internal department for inbound Zoho ticket',
    );
  }

  private async resolveIntegrationUserId(): Promise<string> {
    const configuredUserId = this.configService
      .get<string>('ZOHO_INTEGRATION_USER_ID')
      ?.trim();

    if (configuredUserId) {
      const configuredUser = await this.prisma.user.findFirst({
        where: {
          id: configuredUserId,
          isActive: true,
        },
        select: { id: true },
      });

      if (configuredUser?.id) {
        return configuredUser.id;
      }
    }

    const fallbackUser = await this.prisma.user.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (!fallbackUser) {
      throw new Error(
        'Unable to resolve integration user for inbound Zoho ticket',
      );
    }

    return fallbackUser.id;
  }

  private resolveInboundDefaultStatus(): GeneralStatusEnum {
    const configuredStatus = this.configService
      .get<string>('ZOHO_INBOUND_DEFAULT_STATUS')
      ?.trim();

    if (
      configuredStatus &&
      Object.values(GeneralStatusEnum).includes(
        configuredStatus as GeneralStatusEnum,
      )
    ) {
      return configuredStatus as GeneralStatusEnum;
    }

    return GeneralStatusEnum.OPEN;
  }

  private generateRiskAssessmentCode(ticketNumber: string | undefined): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:.TZ]/g, '')
      .slice(2, 14);
    const randomSuffix = randomUUID()
      .replace(/-/g, '')
      .slice(0, 6)
      .toUpperCase();
    const ticketSuffix = ticketNumber?.trim() ? `-${ticketNumber.trim()}` : '';
    return `ZRA-${timestamp}${ticketSuffix}-${randomSuffix}`;
  }

  private composeDescription(ticket: ZohoTicketAddDataDto): string {
    const subject = ticket.subject?.trim() || 'No subject';
    const description = ticket.description?.trim() || 'No description';
    const priority = ticket.priority?.trim() || 'Unspecified';

    return `[Zoho Subject] ${subject}\n[Zoho Priority] ${priority}\n[Zoho Description] ${description}`;
  }

  private composeActionPlan(ticket: ZohoTicketAddDataDto): string {
    const mappedSeverity = this.mapPriorityToSeverity(ticket.priority);
    return `Inbound Zoho Ticket ${ticket.id} mapped with severity=${mappedSeverity}`;
  }

  private mapPriorityToSeverity(
    priority: string | undefined,
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' {
    const normalized = (priority || '').toLowerCase().trim();

    if (normalized === 'urgent' || normalized === 'critical') {
      return 'EXTREME';
    }

    if (normalized === 'high') {
      return 'HIGH';
    }

    if (normalized === 'medium') {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  private async tryCreateWebhookLogOrIgnoreUnique(params: {
    requestId: string;
    eventType: string;
    eventKey: string;
    ticketId?: string;
    correlationId?: string;
    status: 'RECEIVED' | 'PROCESSED' | 'IGNORED_DUPLICATE' | 'FAILED';
    payload: ZohoWebhookDto;
    errorMessage?: string;
    errorSummary?: string;
  }): Promise<boolean> {
    try {
      await this.validatorService.createWebhookLog(params);
      return true;
    } catch (error) {
      if (this.isPrismaUniqueViolation(error)) {
        return false;
      }

      throw error;
    }
  }

  private isPrismaUniqueViolation(error: unknown): boolean {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      return true;
    }

    return false;
  }

  private readStringField(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
}
