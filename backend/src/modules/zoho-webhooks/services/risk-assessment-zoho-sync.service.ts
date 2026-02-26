import { GeneralStatusEnum, Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { SETTINGS_KEYS } from '../../settings/constants/settings-keys';
import { DEFAULT_ZOHO_STATUS_MAP } from '../constants/zoho-status-map';
import { ZohoConfigService } from './zoho-config.service';

@Injectable()
export class RiskAssessmentZohoSyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly zohoConfigService: ZohoConfigService,
  ) { }

  async enqueueStatusSyncIfNeeded(params: {
    riskAssessmentId: string;
    oldStatus: GeneralStatusEnum;
    newStatus: GeneralStatusEnum;
    correlationId?: string;
  }): Promise<void> {
    const { riskAssessmentId, oldStatus, newStatus } = params;

    const syncEnabled = await this.zohoConfigService.getBoolean(
      SETTINGS_KEYS.ZOHO_SYNC_ENABLED,
      true,
    );
    if (!syncEnabled || oldStatus === newStatus) {
      return;
    }

    const mapping = await this.prisma.zohoTicketRiskAssessmentMap.findUnique({
      where: { hseTaskId: riskAssessmentId },
      select: {
        id: true,
        zohoTicketId: true,
        lastZohoStatus: true,
      },
    });

    if (!mapping) {
      return;
    }

    const statusMap = await this.resolveStatusMap();
    const targetStatus = statusMap[newStatus];
    if (!targetStatus) {
      return;
    }

    if (mapping.lastZohoStatus === targetStatus) {
      return;
    }

    const maxAttempts = await this.zohoConfigService.getNumber(
      SETTINGS_KEYS.ZOHO_MAX_RETRIES,
      6,
    );

    await this.prisma.zohoOutboundJob.create({
      data: {
        mappingId: mapping.id,
        ticketId: mapping.zohoTicketId,
        targetStatus,
        requestPayload: {
          status: targetStatus,
        } as Prisma.InputJsonValue,
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
}
