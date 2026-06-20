import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';
import { AccessLogsModule } from '../access-logs/access-logs.module';
import { SettingsModule } from '../settings/settings.module';
import { ZohoWebhookGuard } from './guards/zoho-webhook.guard';
import { ZohoWebhooksController } from './zoho-webhooks.controller';
import { IncidentZohoSyncService } from './services/incident-zoho-sync.service';
import { ZohoConfigService } from './services/zoho-config.service';
import { ZohoDeskApiClient } from './services/zoho-desk-api.client';
import { ZohoOutboundWorkerService } from './services/zoho-outbound-worker.service';
import { ZohoWebhookService } from './services/zoho-webhook.service';
import { ZohoWebhookValidatorService } from './services/zoho-webhook-validator.service';

@Module({
  imports: [PrismaModule, SharedModule, AccessLogsModule, SettingsModule],
  controllers: [ZohoWebhooksController],
  providers: [
    ZohoConfigService,
    ZohoWebhookService,
    ZohoWebhookValidatorService,
    ZohoWebhookGuard,
    ZohoDeskApiClient,
    IncidentZohoSyncService,
    ZohoOutboundWorkerService,
  ],
  exports: [ZohoWebhookService, IncidentZohoSyncService],
})
export class ZohoWebhooksModule { }
