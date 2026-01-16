import { Module } from '@nestjs/common';
import { ZohoWebhooksController } from './zoho-webhooks.controller';
import { ZohoWebhookService } from './services/zoho-webhook.service';
import { ZohoWebhookValidatorService } from './services/zoho-webhook-validator.service';
import { ZohoWebhookGuard } from './guards/zoho-webhook.guard';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [PrismaModule, SharedModule, SettingsModule],
  controllers: [ZohoWebhooksController],
  providers: [
    ZohoWebhookService,
    ZohoWebhookValidatorService,
    ZohoWebhookGuard,
  ],
  exports: [ZohoWebhookService],
})
export class ZohoWebhooksModule {}
