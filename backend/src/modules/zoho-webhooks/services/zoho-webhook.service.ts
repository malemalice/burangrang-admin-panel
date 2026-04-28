import { GeneralStatusEnum, Prisma } from '@prisma/client';
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { SETTINGS_KEYS } from '../../settings/constants/settings-keys';
import { DEFAULT_ZOHO_INBOUND_STATUS_MAP } from '../constants/zoho-inbound-status-map';
import { ZOHO_EVENT_TYPES } from '../constants/zoho-event-types';
import { ZohoTicketAddDataDto } from '../dto/zoho-ticket-add.dto';
import {
  ZohoWebhookDto,
  ZohoWebhookResponseDto,
} from '../dto/zoho-webhook.dto';
import { ZohoConfigService } from './zoho-config.service';
import { ZohoWebhookValidatorService } from './zoho-webhook-validator.service';

interface InboundProcessingParams {
  payload: ZohoWebhookDto;
  eventType: string;
  requestId: string;
  eventKey: string;
  correlationId: string;
  ticketData: ZohoTicketAddDataDto;
  isLegacyRoute: boolean;
}

interface InboundUpdateContext {
  mappingId: string;
  hseTaskId: string;
  departmentId: string;
  mappedStatus: GeneralStatusEnum | null;
  zohoStatus: string | null;
}

@Injectable()
export class ZohoWebhookService {
  private readonly logger = new Logger(ZohoWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly zohoConfigService: ZohoConfigService,
    private readonly validatorService: ZohoWebhookValidatorService,
  ) { }

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
    const normalizedPayload = this.normalizeInboundPayload(payload);
    const ticketData = this.extractTicketData(normalizedPayload);
    const requestTimestamp = this.extractRequestTimestamp(normalizedPayload);
    const eventKeySeed = requestIdHeader?.trim() || requestTimestamp;

    if (!ticketData.id) {
      const invalidEventKey = this.validatorService.buildEventKey(
        eventType,
        'NO_TICKET_ID',
        eventKeySeed,
        normalizedPayload,
      );

      await this.tryCreateWebhookLogOrIgnoreUnique({
        requestId,
        eventType,
        eventKey: invalidEventKey,
        ticketId: undefined,
        correlationId,
        status: 'FAILED',
        payload: normalizedPayload,
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
      normalizedPayload,
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
      payload: normalizedPayload,
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
        payload: normalizedPayload,
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

  private async processInboundAsync(
    params: InboundProcessingParams,
  ): Promise<void> {
    const { eventType } = params;

    try {
      if (eventType === ZOHO_EVENT_TYPES.TICKET_ADD) {
        await this.handleTicketAddInbound(params);
        return;
      }

      if (eventType === ZOHO_EVENT_TYPES.TICKET_UPDATE) {
        await this.handleTicketUpdateInbound(params);
        return;
      }

      await this.validatorService.updateWebhookLog(params.eventKey, 'PROCESSED', {
        errorSummary: `Ignored unsupported event type: ${eventType}`,
      });

      this.validatorService.logStructured({
        correlationId: params.correlationId,
        requestId: params.requestId,
        eventType,
        eventKey: params.eventKey,
        zohoTicketId: params.ticketData.id,
        result: 'ignored_event_type',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await this.validatorService.updateWebhookLog(params.eventKey, 'FAILED', {
        errorMessage: message,
        errorSummary: message.slice(0, 512),
      });

      this.logger.error(
        JSON.stringify({
          correlationId: params.correlationId,
          requestId: params.requestId,
          eventType: params.eventType,
          eventKey: params.eventKey,
          zohoTicketId: params.ticketData.id,
          result: 'failed',
          error: message,
        }),
      );
    }
  }

  private async handleTicketAddInbound(
    params: InboundProcessingParams,
  ): Promise<void> {
    const {
      payload,
      eventType,
      requestId,
      eventKey,
      correlationId,
      ticketData,
      isLegacyRoute,
    } = params;

    if (await this.validatorService.hasEntityMapping(ticketData.id)) {
      await this.validatorService.updateWebhookLog(eventKey, 'IGNORED_DUPLICATE', {
        errorSummary: `Duplicate entity mapping for Zoho ticket ${ticketData.id}`,
      });

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

    const departmentId = await this.resolveDepartmentId(ticketData.departmentId);
    const integrationUserId = await this.resolveIntegrationUserId();
    const initialStatus = await this.resolveInboundDefaultStatus();
    const generatedCode = this.generateRiskAssessmentCode(ticketData.ticketNumber);
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
  }

  private async handleTicketUpdateInbound(
    params: InboundProcessingParams,
  ): Promise<void> {
    const updateContext = await this.resolveInboundUpdateContext(
      params.payload,
      params.ticketData,
    );

    const updatedRiskAssessment = await this.updateMappedRiskAssessmentFromZoho(
      params.ticketData,
      updateContext,
    );

    await this.prisma.zohoTicketRiskAssessmentMap.update({
      where: { id: updateContext.mappingId },
      data: {
        lastZohoStatus: updateContext.zohoStatus,
        lastHseStatus: updateContext.mappedStatus ?? updatedRiskAssessment.status,
        rawPayload: params.payload as unknown as Prisma.InputJsonValue,
      },
    });

    await this.validatorService.updateWebhookLog(params.eventKey, 'PROCESSED');

    this.validatorService.logStructured({
      correlationId: params.correlationId,
      requestId: params.requestId,
      eventType: params.eventType,
      eventKey: params.eventKey,
      zohoTicketId: params.ticketData.id,
      hseTaskId: updateContext.hseTaskId,
      legacyRoute: params.isLegacyRoute,
      result: 'processed',
    });
  }

  private async resolveInboundUpdateContext(
    payload: ZohoWebhookDto,
    ticketData: ZohoTicketAddDataDto,
  ): Promise<InboundUpdateContext> {
    const mapping = await this.prisma.zohoTicketRiskAssessmentMap.findUnique({
      where: { zohoTicketId: ticketData.id },
      select: {
        id: true,
        hseTaskId: true,
        lastZohoStatus: true,
        lastHseStatus: true,
      },
    });

    if (!mapping?.hseTaskId) {
      throw new Error(
        `No risk assessment mapping found for Zoho ticket ${ticketData.id}`,
      );
    }

    const departmentId = await this.resolveDepartmentId(ticketData.departmentId);
    const zohoStatus = this.extractZohoStatusValue(payload);
    const mappedStatus = await this.resolveInboundStatusFromZoho(zohoStatus);

    return {
      mappingId: mapping.id,
      hseTaskId: mapping.hseTaskId,
      departmentId,
      mappedStatus,
      zohoStatus,
    };
  }

  private async updateMappedRiskAssessmentFromZoho(
    ticketData: ZohoTicketAddDataDto,
    updateContext: InboundUpdateContext,
  ) {
    const mappedDescription = this.composeDescription(ticketData);
    const actionPlan = this.composeActionPlan(ticketData);

    return this.prisma.riskAssessment.update({
      where: { id: updateContext.hseTaskId },
      data: {
        description: mappedDescription,
        departmentId: updateContext.departmentId,
        status: updateContext.mappedStatus ?? undefined,
        actionPlan,
      },
    });
  }

  private extractTicketData(payload: ZohoWebhookDto): ZohoTicketAddDataDto {
    const data = payload.data ?? {};

    return {
      id: this.readStringField(data.id)?.trim() ?? '',
      ticketNumber: this.readStringField(data.ticketNumber),
      subject: this.readStringField(data.subject),
      description: this.readStringField(data.description),
      priority: this.extractPriorityValue(data.priority),
      departmentId: this.normalizeNullableString(
        this.readStringField(data.departmentId),
      ),
    };
  }

  private extractRequestTimestamp(payload: ZohoWebhookDto): string {
    const meta = payload.meta ?? {};
    const timestamp = meta.timestamp;
    const parsedTimestamp = this.extractTimestampValue(timestamp);

    if (parsedTimestamp) {
      return parsedTimestamp;
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

    const fallbackDepartmentId = await this.zohoConfigService.getString(
      SETTINGS_KEYS.ZOHO_DEFAULT_DEPARTMENT_ID,
      '',
    );

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
    const configuredUserId = await this.zohoConfigService.getString(
      SETTINGS_KEYS.ZOHO_INTEGRATION_USER_ID,
      '',
    );

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

  private async resolveInboundDefaultStatus(): Promise<GeneralStatusEnum> {
    const configuredStatus = await this.zohoConfigService.getString(
      SETTINGS_KEYS.ZOHO_INBOUND_DEFAULT_STATUS,
      '',
    );

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

  private async resolveInboundStatusFromZoho(
    zohoStatus: string | null,
  ): Promise<GeneralStatusEnum | null> {
    if (!zohoStatus) {
      return null;
    }

    const configuredMap = await this.zohoConfigService.getJsonRecord(
      SETTINGS_KEYS.ZOHO_INBOUND_STATUS_MAP,
      this.serializeInboundStatusMap(DEFAULT_ZOHO_INBOUND_STATUS_MAP),
    );

    const resolvedValue = configuredMap[zohoStatus]?.trim();
    if (
      resolvedValue &&
      Object.values(GeneralStatusEnum).includes(
        resolvedValue as GeneralStatusEnum,
      )
    ) {
      return resolvedValue as GeneralStatusEnum;
    }

    const fallback = DEFAULT_ZOHO_INBOUND_STATUS_MAP[zohoStatus];
    return fallback ?? null;
  }

  private serializeInboundStatusMap(
    statusMap: Record<string, GeneralStatusEnum>,
  ): Record<string, string> {
    return Object.fromEntries(
      Object.entries(statusMap).map(([key, value]) => [key, value]),
    );
  }

  private extractZohoStatusValue(payload: ZohoWebhookDto): string | null {
    const payloadStatus = this.readStringField(payload.data?.status);

    if (payloadStatus) {
      return payloadStatus;
    }

    return null;
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
    const normalized = this.extractPriorityLabel(priority).toLowerCase().trim();

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

  private normalizeInboundPayload(payload: ZohoWebhookDto): ZohoWebhookDto {
    const wrappedBody = payload.body;

    if (
      wrappedBody &&
      typeof wrappedBody === 'object' &&
      !Array.isArray(wrappedBody)
    ) {
      const bodyRecord = wrappedBody;
      return {
        data: this.readObjectField(bodyRecord.data) ?? payload.data,
        meta: this.readObjectField(bodyRecord.meta) ?? payload.meta,
      };
    }

    return payload;
  }

  private extractPriorityValue(value: unknown): string | undefined {
    const priority = this.readStringField(value);

    if (!priority) {
      return undefined;
    }

    const parsedPriority = this.tryParseJsonObject(priority);
    if (!parsedPriority) {
      return priority;
    }

    const name = this.readStringField(parsedPriority.name);
    return name ?? priority;
  }

  private extractPriorityLabel(priority: string | undefined): string {
    if (!priority) {
      return '';
    }

    const parsedPriority = this.tryParseJsonObject(priority);
    if (!parsedPriority) {
      return priority;
    }

    const name = this.readStringField(parsedPriority.name);
    return name ?? priority;
  }

  private extractTimestampValue(value: unknown): string | undefined {
    const timestamp = this.readStringField(value);
    if (!timestamp) {
      return undefined;
    }

    const parsedTimestamp = this.tryParseJsonObject(timestamp);
    if (!parsedTimestamp) {
      return timestamp;
    }

    const timestampValue = this.readStringField(parsedTimestamp.value);
    if (timestampValue) {
      return timestampValue;
    }

    const displayValue = this.readStringField(parsedTimestamp.display_value);
    return displayValue ?? timestamp;
  }

  private normalizeNullableString(
    value: string | undefined,
  ): string | undefined {
    if (!value) {
      return undefined;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'null' || normalized === 'undefined') {
      return undefined;
    }

    return value;
  }

  private readObjectField(value: unknown): Record<string, unknown> | undefined {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    return undefined;
  }

  private tryParseJsonObject(
    value: string,
  ): Record<string, unknown> | undefined {
    const trimmed = value.trim();
    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
      return undefined;
    }

    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return undefined;
    }

    return undefined;
  }

  private readStringField(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
}
