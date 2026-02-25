import { GeneralStatusEnum, Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { DEFAULT_ZOHO_STATUS_MAP } from '../constants/zoho-status-map';

@Injectable()
export class RiskAssessmentZohoSyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async enqueueStatusSyncIfNeeded(params: {
    riskAssessmentId: string;
    oldStatus: GeneralStatusEnum;
    newStatus: GeneralStatusEnum;
    correlationId?: string;
  }): Promise<void> {
    const { riskAssessmentId, oldStatus, newStatus } = params;

    const syncEnabled = this.getBoolean('ZOHO_SYNC_ENABLED', true);
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

    const statusMap = this.resolveStatusMap();
    const targetStatus = statusMap[newStatus];
    if (!targetStatus) {
      return;
    }

    if (mapping.lastZohoStatus === targetStatus) {
      return;
    }

    const maxAttempts = Number(
      this.configService.get<string>('ZOHO_MAX_RETRIES') || 6,
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

  private resolveStatusMap(): Record<string, string> {
    const envRaw = this.configService.get<string>('ZOHO_STATUS_MAP');
    if (!envRaw) {
      return DEFAULT_ZOHO_STATUS_MAP;
    }

    try {
      const parsed = JSON.parse(envRaw) as Record<string, string>;
      return {
        ...DEFAULT_ZOHO_STATUS_MAP,
        ...parsed,
      };
    } catch {
      return DEFAULT_ZOHO_STATUS_MAP;
    }
  }

  private getBoolean(key: string, defaultValue: boolean): boolean {
    const value = this.configService.get<string>(key);
    if (value === undefined || value === null) {
      return defaultValue;
    }

    return value.toLowerCase() === 'true' || value === '1';
  }
}
