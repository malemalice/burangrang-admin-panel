import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { SharedModule } from '../../shared/shared.module';
import { ZohoWebhookGuard } from './guards/zoho-webhook.guard';
import { ZohoWebhooksController } from './zoho-webhooks.controller';
import { RiskAssessmentZohoSyncService } from './services/risk-assessment-zoho-sync.service';
import { ZohoDeskApiClient } from './services/zoho-desk-api.client';
import { ZohoOutboundWorkerService } from './services/zoho-outbound-worker.service';
import { ZohoConfigService } from './services/zoho-config.service';
import { ZohoWebhookService } from './services/zoho-webhook.service';
import { ZohoWebhookValidatorService } from './services/zoho-webhook-validator.service';

@Module({
  imports: [PrismaModule, SettingsModule, SharedModule],
  controllers: [ZohoWebhooksController],
  providers: [
    ZohoConfigService,
    ZohoWebhookService,
    ZohoWebhookValidatorService,
    ZohoWebhookGuard,
    ZohoDeskApiClient,
    RiskAssessmentZohoSyncService,
    ZohoOutboundWorkerService,
  ],
  exports: [ZohoWebhookService, RiskAssessmentZohoSyncService],
})
export class ZohoWebhooksModule { }
