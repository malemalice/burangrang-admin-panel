import {
  GeneralStatusEnum,
  IncidentClassificationEnum,
  IncidentTypeEnum,
  Prisma,
  PriorityEnum,
  SourceEnum,
} from '@prisma/client';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
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

    const assignedDepartmentId = await this.resolveDepartmentId(
      ticketData.departmentId,
    );
    const integrationUserId = await this.resolveIntegrationUserId();
    const initialStatus = await this.resolveInboundDefaultStatus();
    const areaId = await this.resolveAreaId(ticketData.area);
    const riskCategoryId = await this.resolveRiskCategoryId(
      ticketData.riskCategory,
    );
    const incidentType = await this.resolveIncidentType(ticketData.incidentType);
    const incidentClassification = await this.resolveIncidentClassification(
      ticketData.incidentClassification,
    );
    const generatedCode = this.generateIncidentCode(ticketData.ticketNumber);
    const subject = ticketData.subject?.trim() || 'No subject';
    const mappedDescription = this.composeDescription(ticketData);
    const priority = this.mapPriorityToIncidentPriority(ticketData.priority);

    const createdIncident = await this.prisma.incident.create({
      data: {
        code: generatedCode,
        subject,
        description: mappedDescription,
        incidentDate: new Date(),
        areaId,
        incidentType,
        incidentClassification,
        priority,
        riskCategoryId,
        assignedDepartmentId,
        requesterId: integrationUserId,
        reportedBy: integrationUserId,
        createdBy: integrationUserId,
        status: initialStatus,
        source: SourceEnum.ZOHO,
        isActive: true,
      },
    });

    await this.prisma.zohoTicketIncidentMap.create({
      data: {
        zohoTicketId: ticketData.id,
        zohoTicketNumber: ticketData.ticketNumber,
        hseTaskId: createdIncident.id,
        lastZohoStatus: null,
        lastHseStatus: createdIncident.status,
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
      hseTaskId: createdIncident.id,
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

    const currentIncident = await this.prisma.incident.findUnique({
      where: { id: updateContext.hseTaskId },
      select: { status: true },
    });

    const shouldUpdateStatus =
      updateContext.mappedStatus !== null &&
      currentIncident !== null &&
      this.getStatusRank(updateContext.mappedStatus) > this.getStatusRank(currentIncident.status);

    const updatedIncident = await this.updateMappedIncidentFromZoho(
      updateContext,
      shouldUpdateStatus,
    );

    await this.prisma.zohoTicketIncidentMap.update({
      where: { id: updateContext.mappingId },
      data: {
        lastZohoStatus: updateContext.zohoStatus,
        lastHseStatus: updateContext.mappedStatus ?? (updatedIncident?.status ?? currentIncident?.status ?? undefined),
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
    const mapping = await this.prisma.zohoTicketIncidentMap.findUnique({
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
        `No incident mapping found for Zoho ticket ${ticketData.id}`,
      );
    }

    const zohoStatus = this.extractZohoStatusValue(payload);
    const mappedStatus = await this.resolveInboundStatusFromZoho(zohoStatus);

    return {
      mappingId: mapping.id,
      hseTaskId: mapping.hseTaskId,
      mappedStatus,
      zohoStatus,
    };
  }

  private async updateMappedIncidentFromZoho(
    updateContext: InboundUpdateContext,
    shouldUpdateStatus: boolean,
  ): Promise<{ status: GeneralStatusEnum } | null> {
    if (!shouldUpdateStatus) {
      return null;
    }

    return this.prisma.incident.update({
      where: { id: updateContext.hseTaskId },
      data: {
        status: updateContext.mappedStatus!,
      },
      select: { status: true },
    });
  }

  private getStatusRank(status: GeneralStatusEnum): number {
    const ranks: Record<GeneralStatusEnum, number> = {
      [GeneralStatusEnum.SCHEDULED]: 0,
      [GeneralStatusEnum.DRAFT]: 1,
      [GeneralStatusEnum.OPEN]: 2,
      [GeneralStatusEnum.WAITING_APPROVAL]: 3,
      [GeneralStatusEnum.DONE]: 4,
      [GeneralStatusEnum.CLOSE]: 4,
      [GeneralStatusEnum.REJECTED]: 4,
    };
    return ranks[status] ?? 0;
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
      area: this.normalizeNullableString(this.readStringField(data.area)),
      riskCategory: this.normalizeNullableString(
        this.readStringField(data.riskCategory),
      ),
      incidentType: this.normalizeNullableString(
        this.readStringField(data.incidentType),
      ),
      incidentClassification: this.normalizeNullableString(
        this.readStringField(data.incidentClassification),
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

  private generateIncidentCode(ticketNumber: string | undefined): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:.TZ]/g, '')
      .slice(2, 14);
    const randomSuffix = randomUUID()
      .replace(/-/g, '')
      .slice(0, 6)
      .toUpperCase();
    const ticketSuffix = ticketNumber?.trim() ? `-${ticketNumber.trim()}` : '';
    return `ZIC-${timestamp}${ticketSuffix}-${randomSuffix}`;
  }

  /**
   * Looks up a Zoho source value in a configured incident field map
   * (Zoho value -> HSE value). Returns the mapped HSE value or null when the
   * Zoho value is empty or has no/blank mapping. Callers fall back to the
   * configured default_* value when this returns null.
   */
  private async resolveFromIncidentMap(
    settingKey: string,
    zohoValue: string | null | undefined,
  ): Promise<string | null> {
    if (!zohoValue) {
      return null;
    }

    const map = await this.zohoConfigService.getJsonRecord(settingKey, {});
    const mapped = map[zohoValue]?.trim();
    return mapped ? mapped : null;
  }

  private async resolveAreaId(zohoArea?: string | null): Promise<string> {
    const mappedAreaId = await this.resolveFromIncidentMap(
      SETTINGS_KEYS.ZOHO_INCIDENT_AREA_MAP,
      zohoArea,
    );

    if (mappedAreaId) {
      const area = await this.prisma.area.findFirst({
        where: { id: mappedAreaId, isActive: true },
        select: { id: true },
      });

      if (area?.id) {
        return area.id;
      }
    }

    const configuredAreaId = await this.zohoConfigService.getString(
      SETTINGS_KEYS.ZOHO_DEFAULT_AREA_ID,
      '',
    );

    if (configuredAreaId) {
      const area = await this.prisma.area.findFirst({
        where: { id: configuredAreaId, isActive: true },
        select: { id: true },
      });

      if (area?.id) {
        return area.id;
      }
    }

    throw new Error(
      'Unable to resolve default area for inbound Zoho ticket (set zoho.inbound.default_area_id)',
    );
  }

  private async resolveRiskCategoryId(
    zohoRiskCategory?: string | null,
  ): Promise<string> {
    const mappedRiskCategoryId = await this.resolveFromIncidentMap(
      SETTINGS_KEYS.ZOHO_INCIDENT_RISK_CATEGORY_MAP,
      zohoRiskCategory,
    );

    if (mappedRiskCategoryId) {
      const riskCategory = await this.prisma.riskCategory.findFirst({
        where: { id: mappedRiskCategoryId, isActive: true },
        select: { id: true },
      });

      if (riskCategory?.id) {
        return riskCategory.id;
      }
    }

    const configuredRiskCategoryId = await this.zohoConfigService.getString(
      SETTINGS_KEYS.ZOHO_DEFAULT_RISK_CATEGORY_ID,
      '',
    );

    if (configuredRiskCategoryId) {
      const riskCategory = await this.prisma.riskCategory.findFirst({
        where: { id: configuredRiskCategoryId, isActive: true },
        select: { id: true },
      });

      if (riskCategory?.id) {
        return riskCategory.id;
      }
    }

    throw new Error(
      'Unable to resolve default risk category for inbound Zoho ticket (set zoho.inbound.default_risk_category_id)',
    );
  }

  private async resolveIncidentType(
    zohoIncidentType?: string | null,
  ): Promise<IncidentTypeEnum> {
    const mapped = await this.resolveFromIncidentMap(
      SETTINGS_KEYS.ZOHO_INCIDENT_INCIDENT_TYPE_MAP,
      zohoIncidentType,
    );

    if (
      mapped &&
      Object.values(IncidentTypeEnum).includes(mapped as IncidentTypeEnum)
    ) {
      return mapped as IncidentTypeEnum;
    }

    const configured = await this.zohoConfigService.getString(
      SETTINGS_KEYS.ZOHO_DEFAULT_INCIDENT_TYPE,
      '',
    );

    if (
      configured &&
      Object.values(IncidentTypeEnum).includes(configured as IncidentTypeEnum)
    ) {
      return configured as IncidentTypeEnum;
    }

    return IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE;
  }

  private async resolveIncidentClassification(
    zohoIncidentClassification?: string | null,
  ): Promise<IncidentClassificationEnum> {
    const mapped = await this.resolveFromIncidentMap(
      SETTINGS_KEYS.ZOHO_INCIDENT_INCIDENT_CLASSIFICATION_MAP,
      zohoIncidentClassification,
    );

    if (
      mapped &&
      Object.values(IncidentClassificationEnum).includes(
        mapped as IncidentClassificationEnum,
      )
    ) {
      return mapped as IncidentClassificationEnum;
    }

    const configured = await this.zohoConfigService.getString(
      SETTINGS_KEYS.ZOHO_DEFAULT_INCIDENT_CLASSIFICATION,
      '',
    );

    if (
      configured &&
      Object.values(IncidentClassificationEnum).includes(
        configured as IncidentClassificationEnum,
      )
    ) {
      return configured as IncidentClassificationEnum;
    }

    return IncidentClassificationEnum.MINOR;
  }

  private composeDescription(ticket: ZohoTicketAddDataDto): string {
    return ticket.description?.trim() || '';
  }

  private mapPriorityToIncidentPriority(
    priority: string | undefined,
  ): PriorityEnum {
    const normalized = this.extractPriorityLabel(priority).toLowerCase().trim();

    if (
      normalized === 'urgent' ||
      normalized === 'critical' ||
      normalized === 'high'
    ) {
      return PriorityEnum.HIGH;
    }

    return PriorityEnum.NORMAL;
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

  async discoverFieldValues(): Promise<{
    area: string[];
    riskCategory: string[];
    incidentType: string[];
    incidentClassification: string[];
  }> {
    const logs = await this.prisma.tZohoWebhookLogs.findMany({
      where: {
        status: 'PROCESSED',
        eventType: ZOHO_EVENT_TYPES.TICKET_ADD,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { payload: true },
    });

    const area = new Set<string>();
    const riskCategory = new Set<string>();
    const incidentType = new Set<string>();
    const incidentClassification = new Set<string>();

    for (const log of logs) {
      const normalized = this.normalizeInboundPayload(
        log.payload as unknown as ZohoWebhookDto,
      );
      const ticket = this.extractTicketData(normalized);
      if (ticket.area) area.add(ticket.area);
      if (ticket.riskCategory) riskCategory.add(ticket.riskCategory);
      if (ticket.incidentType) incidentType.add(ticket.incidentType);
      if (ticket.incidentClassification)
        incidentClassification.add(ticket.incidentClassification);
    }

    return {
      area: [...area].sort(),
      riskCategory: [...riskCategory].sort(),
      incidentType: [...incidentType].sort(),
      incidentClassification: [...incidentClassification].sort(),
    };
  }

  async listOutboundJobs(params: {
    page: number;
    limit: number;
    status?: string;
  }): Promise<{ data: unknown[]; meta: { total: number; page: number; limit: number } }> {
    const { page, limit, status } = params;
    const where: Prisma.ZohoOutboundJobWhereInput = status
      ? { status: status as import('@prisma/client').ZohoOutboundJobStatusEnum }
      : {};

    const [jobs, total] = await Promise.all([
      this.prisma.zohoOutboundJob.findMany({
        where,
        include: {
          mapping: {
            select: { hseTaskId: true, zohoTicketNumber: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.zohoOutboundJob.count({ where }),
    ]);

    return { data: jobs, meta: { total, page, limit } };
  }

  async retryDeadLetterJob(id: string): Promise<void> {
    const job = await this.prisma.zohoOutboundJob.findUnique({ where: { id } });

    if (!job) {
      throw new NotFoundException(`Outbound job ${id} not found`);
    }

    if (job.status !== 'FAILED_DEAD_LETTER') {
      throw new BadRequestException(
        `Job ${id} has status "${job.status}" — only FAILED_DEAD_LETTER jobs can be retried`,
      );
    }

    await this.prisma.zohoOutboundJob.update({
      where: { id },
      data: {
        status: 'PENDING',
        nextRetryAt: new Date(),
        attemptCount: 0,
        lastError: null,
      },
    });
  }

  async listWebhookLogs(params: {
    page: number;
    limit: number;
    status?: string;
  }): Promise<{ data: unknown[]; meta: { total: number; page: number; limit: number } }> {
    const { page, limit, status } = params;
    const where = status ? { status } : {};

    const [logs, total] = await Promise.all([
      this.prisma.tZohoWebhookLogs.findMany({
        where,
        select: {
          id: true,
          eventType: true,
          ticketId: true,
          status: true,
          errorSummary: true,
          correlationId: true,
          createdAt: true,
          processedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.tZohoWebhookLogs.count({ where }),
    ]);

    return { data: logs, meta: { total, page, limit } };
  }
}
