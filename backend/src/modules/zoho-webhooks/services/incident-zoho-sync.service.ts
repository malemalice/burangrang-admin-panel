import { GeneralStatusEnum, Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { AccessLogsService } from '../../access-logs/services/access-logs.service';
import { SETTINGS_KEYS } from '../../settings/constants/settings-keys';
import { DEFAULT_ZOHO_STATUS_MAP } from '../constants/zoho-status-map';
import { SdpRequestPayload } from '../types/sdp-request-payload.types';
import { ZohoConfigService } from './zoho-config.service';
import { ZohoDeskApiClient } from './zoho-desk-api.client';

@Injectable()
export class IncidentZohoSyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly zohoConfigService: ZohoConfigService,
    private readonly zohoDeskApiClient: ZohoDeskApiClient,
    private readonly accessLogsService: AccessLogsService,
  ) { }

  async enqueueStatusSyncIfNeeded(params: {
    incidentId: string;
    oldStatus: GeneralStatusEnum;
    newStatus: GeneralStatusEnum;
    correlationId?: string;
  }): Promise<void> {
    const { incidentId, oldStatus, newStatus } = params;

    const syncEnabled = await this.zohoConfigService.getBoolean(
      SETTINGS_KEYS.ZOHO_SYNC_ENABLED,
      true,
    );
    if (!syncEnabled || oldStatus === newStatus) {
      return;
    }

    const mapping = await this.findMapping(incidentId);
    if (!mapping) {
      return;
    }

    const statusMap = await this.resolveStatusMap();
    const targetStatus = statusMap[newStatus];
    if (!targetStatus || mapping.lastZohoStatus === targetStatus) {
      return;
    }

    await this.enqueueOutboundJob({
      mappingId: mapping.id,
      ticketId: mapping.zohoTicketId,
      targetStatus,
      payload: {
        status: {
          name: targetStatus,
        },
      },
      correlationId: params.correlationId,
    });
  }

  async enqueueFullPayloadSync(params: {
    incidentId: string;
    payload: SdpRequestPayload;
    targetStatus?: string;
    correlationId?: string;
    skipIfSameStatus?: boolean;
  }): Promise<void> {
    const syncEnabled = await this.zohoConfigService.getBoolean(
      SETTINGS_KEYS.ZOHO_SYNC_ENABLED,
      true,
    );
    if (!syncEnabled) {
      return;
    }

    const mapping = await this.findMapping(params.incidentId);
    if (!mapping) {
      return;
    }

    const payload = this.normalizePayload(params.payload);
    const resolvedTargetStatus = this.resolveTargetStatus(
      params.targetStatus,
      payload.status,
    );

    if (
      params.skipIfSameStatus !== false &&
      resolvedTargetStatus &&
      mapping.lastZohoStatus === resolvedTargetStatus
    ) {
      const payloadKeys = Object.keys(payload);
      const statusOnlyPayload =
        payloadKeys.length === 1 && payloadKeys[0] === 'status';

      if (statusOnlyPayload) {
        return;
      }
    }

    if (Object.keys(payload).length === 0) {
      return;
    }

    await this.enqueueOutboundJob({
      mappingId: mapping.id,
      ticketId: mapping.zohoTicketId,
      targetStatus: resolvedTargetStatus ?? mapping.lastZohoStatus ?? '',
      payload,
      correlationId: params.correlationId,
    });
  }

  async createTicketForIncident(params: {
    incidentId: string;
    payload: SdpRequestPayload;
    lastHseStatus?: GeneralStatusEnum;
    correlationId?: string;
  }): Promise<{
    mappingId: string;
    zohoTicketId: string;
    zohoTicketNumber?: string;
  } | null> {
    const syncEnabled = await this.zohoConfigService.getBoolean(
      SETTINGS_KEYS.ZOHO_SYNC_ENABLED,
      true,
    );
    if (!syncEnabled) {
      return null;
    }

    const authToken = await this.zohoConfigService.getString(
      SETTINGS_KEYS.SDP_AUTHTOKEN,
      '',
    );
    if (!authToken?.trim()) {
      const correlationId = params.correlationId || `corr-${randomUUID()}`;
      await this.accessLogsService.createAccessLog({
        method: 'POST',
        endpoint: '/api/v3/requests',
        statusCode: 200,
        payload: {
          source: 'incident_zoho_create_skip',
          correlationId,
          incidentId: params.incidentId,
          result: 'skipped_missing_sdp_authtoken',
          errorMessage: 'Zoho create skipped: SDP_AUTHTOKEN not configured',
          requestFieldKeys: Object.keys(params.payload ?? {}),
        },
        userAgent: 'IncidentZohoSyncService',
        executionTime: 0,
      });
      return null;
    }

    const existingMapping = await this.findMapping(params.incidentId);
    if (existingMapping) {
      return {
        mappingId: existingMapping.id,
        zohoTicketId: existingMapping.zohoTicketId,
        zohoTicketNumber: undefined,
      };
    }

    const payload = this.normalizePayload(params.payload);
    if (Object.keys(payload).length === 0) {
      return null;
    }

    const correlationId = params.correlationId || `corr-${randomUUID()}`;
    const startedAt = Date.now();
    const endpoint = '/api/v3/requests';

    try {
      const response = await this.zohoDeskApiClient.createRequest(
        payload,
        correlationId,
      );
      const createdTicket = this.extractCreatedTicket(response);

      if (!createdTicket.id) {
        throw new Error('Zoho create request response does not contain ticket id');
      }

      try {
        const mapping = await this.prisma.zohoTicketIncidentMap.create({
          data: {
            zohoTicketId: createdTicket.id,
            zohoTicketNumber: createdTicket.ticketNumber ?? null,
            hseTaskId: params.incidentId,
            lastZohoStatus:
              this.resolveTargetStatus(undefined, payload.status) ?? null,
            lastHseStatus: params.lastHseStatus ?? null,
            rawPayload: {
              requestPayload: payload,
              responsePayload: response,
            } as unknown as Prisma.InputJsonValue,
          },
        });

        await this.logCreateAccess({
          endpoint,
          correlationId,
          incidentId: params.incidentId,
          statusCode: 200,
          result: 'success',
          startedAt,
          requestPayload: payload,
          responsePayload: response,
          ticketId: mapping.zohoTicketId,
          mappingId: mapping.id,
        });

        return {
          mappingId: mapping.id,
          zohoTicketId: mapping.zohoTicketId,
          zohoTicketNumber: mapping.zohoTicketNumber ?? undefined,
        };
      } catch (error) {
        if (this.isUniqueViolation(error)) {
          const mapping = await this.findMapping(params.incidentId);
          if (mapping) {
            await this.logCreateAccess({
              endpoint,
              correlationId,
              incidentId: params.incidentId,
              statusCode: 200,
              result: 'success_existing_mapping',
              startedAt,
              requestPayload: payload,
              responsePayload: response,
              ticketId: mapping.zohoTicketId,
              mappingId: mapping.id,
            });

            return {
              mappingId: mapping.id,
              zohoTicketId: mapping.zohoTicketId,
              zohoTicketNumber: undefined,
            };
          }
        }

        throw error;
      }
    } catch (error) {
      await this.logCreateAccess({
        endpoint,
        correlationId,
        incidentId: params.incidentId,
        statusCode: this.readStatusCode(error) ?? 500,
        result: 'failed',
        startedAt,
        requestPayload: payload,
        responsePayload: this.extractResponseBody(error),
        errorMessage: this.stringifyError(error),
      });

      throw error;
    }
  }

  async resolveZohoStatusForHseStatus(
    status: GeneralStatusEnum,
  ): Promise<string | undefined> {
    const statusMap = await this.resolveStatusMap();
    return statusMap[status];
  }

  async getOutboundRequesterId(): Promise<string | undefined> {
    const id = await this.zohoConfigService.getString(
      SETTINGS_KEYS.ZOHO_OUTBOUND_REQUESTER_ID,
      '',
    );
    return id?.trim() || undefined;
  }

  private async findMapping(incidentId: string): Promise<{
    id: string;
    zohoTicketId: string;
    lastZohoStatus: string | null;
  } | null> {
    return this.prisma.zohoTicketIncidentMap.findUnique({
      where: { hseTaskId: incidentId },
      select: {
        id: true,
        zohoTicketId: true,
        lastZohoStatus: true,
      },
    });
  }

  private normalizePayload(payload: SdpRequestPayload): SdpRequestPayload {
    const normalized: SdpRequestPayload = {};

    for (const [key, value] of Object.entries(payload) as Array<
      [keyof SdpRequestPayload, SdpRequestPayload[keyof SdpRequestPayload]]
    >) {
      if (value === undefined || value === null) {
        continue;
      }

      if (typeof value === 'string' && value.trim().length === 0) {
        continue;
      }

      if (Array.isArray(value) && value.length === 0) {
        continue;
      }

      Object.assign(normalized, {
        [key]: value,
      });
    }

    return normalized;
  }

  private resolveTargetStatus(
    explicitTargetStatus: string | undefined,
    payloadStatus: SdpRequestPayload['status'],
  ): string | undefined {
    if (explicitTargetStatus?.trim()) {
      return explicitTargetStatus;
    }

    if (typeof payloadStatus === 'string' && payloadStatus.trim()) {
      return payloadStatus;
    }

    if (
      payloadStatus &&
      typeof payloadStatus === 'object' &&
      'name' in payloadStatus &&
      typeof payloadStatus.name === 'string' &&
      payloadStatus.name.trim()
    ) {
      return payloadStatus.name;
    }

    if (
      payloadStatus &&
      typeof payloadStatus === 'object' &&
      'id' in payloadStatus &&
      typeof payloadStatus.id === 'string' &&
      payloadStatus.id.trim()
    ) {
      return payloadStatus.id;
    }

    return undefined;
  }

  private async enqueueOutboundJob(params: {
    mappingId: string;
    ticketId: string;
    targetStatus: string;
    payload: SdpRequestPayload;
    correlationId?: string;
  }): Promise<void> {
    const maxAttempts = await this.zohoConfigService.getNumber(
      SETTINGS_KEYS.ZOHO_MAX_RETRIES,
      6,
    );

    const existing = await this.prisma.zohoOutboundJob.findFirst({
      where: {
        mappingId: params.mappingId,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
      select: { id: true },
    });

    if (existing) {
      await this.prisma.zohoOutboundJob.update({
        where: { id: existing.id },
        data: {
          targetStatus: params.targetStatus,
          requestPayload: params.payload as Prisma.InputJsonValue,
          correlationId: params.correlationId || `corr-${randomUUID()}`,
        },
      });
      return;
    }

    await this.prisma.zohoOutboundJob.create({
      data: {
        mappingId: params.mappingId,
        ticketId: params.ticketId,
        targetStatus: params.targetStatus,
        requestPayload: params.payload as Prisma.InputJsonValue,
        status: 'PENDING',
        attemptCount: 0,
        maxAttempts,
        nextRetryAt: new Date(),
        correlationId: params.correlationId || `corr-${randomUUID()}`,
      },
    });
  }

  private async resolveStatusMap(): Promise<Record<string, string>> {
    const parsed = await this.zohoConfigService.getJsonRecord(
      SETTINGS_KEYS.ZOHO_STATUS_MAP,
      DEFAULT_ZOHO_STATUS_MAP,
    );

    return {
      ...DEFAULT_ZOHO_STATUS_MAP,
      ...parsed,
    };
  }

  private extractCreatedTicket(response: Record<string, unknown>): {
    id?: string;
    ticketNumber?: string;
  } {
    const requestRecord = this.readObject(response.request);
    const responseRecord = this.readObject(response.response);
    const dataRecord = this.readObject(response.data);

    const id =
      this.readString(requestRecord?.id) ||
      this.readString(responseRecord?.id) ||
      this.readString(dataRecord?.id);

    const ticketNumber =
      this.readString(requestRecord?.ticket_number) ||
      this.readString(requestRecord?.ticketNumber) ||
      this.readString(responseRecord?.ticket_number) ||
      this.readString(responseRecord?.ticketNumber) ||
      this.readString(dataRecord?.ticket_number) ||
      this.readString(dataRecord?.ticketNumber);

    return {
      id,
      ticketNumber,
    };
  }

  private async logCreateAccess(params: {
    endpoint: string;
    correlationId: string;
    incidentId: string;
    statusCode: number;
    result: 'success' | 'success_existing_mapping' | 'failed';
    startedAt: number;
    requestPayload: SdpRequestPayload;
    responsePayload?: Record<string, unknown> | Prisma.InputJsonValue;
    errorMessage?: string;
    ticketId?: string;
    mappingId?: string;
  }): Promise<void> {
    await this.accessLogsService.createAccessLog({
      method: 'POST',
      endpoint: params.endpoint,
      statusCode: params.statusCode,
      payload: {
        source: 'incident_zoho_create',
        correlationId: params.correlationId,
        incidentId: params.incidentId,
        mappingId: params.mappingId,
        ticketId: params.ticketId,
        result: params.result,
        requestPayload: params.requestPayload as unknown as Record<string, unknown>,
        requestFieldKeys: Object.keys(params.requestPayload),
        requestPayloadPreview: JSON.stringify({
          request: params.requestPayload,
        }),
        responsePayload: this.toAccessLogRecord(params.responsePayload),
        errorMessage: params.errorMessage,
      },
      userAgent: 'IncidentZohoSyncService',
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

  private readObject(
    value: unknown,
  ): Record<string, unknown> | undefined {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return undefined;
    }

    return value as Record<string, unknown>;
  }

  private readString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
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
      if (responseBody && typeof responseBody === 'object' && !Array.isArray(responseBody)) {
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

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    );
  }
}
