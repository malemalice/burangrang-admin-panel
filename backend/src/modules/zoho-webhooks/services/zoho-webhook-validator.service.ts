import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';

@Injectable()
export class ZohoWebhookValidatorService {
  private readonly logger = new Logger(ZohoWebhookValidatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  async isDuplicate(requestId: string): Promise<boolean> {
    if (!requestId) {
      return false;
    }

    try {
      const existing = await this.prisma.tZohoWebhookLogs.findUnique({
        where: { requestId },
      });

      if (existing) {
        this.logger.warn(`Duplicate webhook request detected: ${requestId}`);
      }

      return !!existing;
    } catch (error) {
      this.logger.error(`Error checking duplicate request: ${error.message}`, error.stack);
      // If there's an error, allow the request to proceed (fail open)
      return false;
    }
  }

  async logWebhook(
    requestId: string,
    eventType: string,
    status: 'processed' | 'failed' | 'duplicate',
    payload: any,
    errorMessage?: string,
  ): Promise<void> {
    try {
      await this.prisma.tZohoWebhookLogs.create({
        data: {
          requestId: requestId || `no-id-${Date.now()}`,
          eventType: eventType || 'unknown',
          status,
          payload: payload as any,
          errorMessage: errorMessage || null,
          processedAt: new Date(),
        },
      });
    } catch (error) {
      // Log error but don't throw - webhook processing should continue
      this.logger.error(`Error logging webhook: ${error.message}`, error.stack);
    }
  }

  async getWebhookLogs(
    requestId: string,
  ): Promise<{ requestId: string; status: string; eventType: string; processedAt: Date } | null> {
    try {
      const log = await this.prisma.tZohoWebhookLogs.findUnique({
        where: { requestId },
        select: {
          requestId: true,
          status: true,
          eventType: true,
          processedAt: true,
        },
      });

      return log;
    } catch (error) {
      this.logger.error(`Error fetching webhook log: ${error.message}`, error.stack);
      return null;
    }
  }
}
