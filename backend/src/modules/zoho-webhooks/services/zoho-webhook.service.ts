import { Injectable, Logger } from '@nestjs/common';
import { ZOHO_EVENT_TYPES } from '../constants/zoho-event-types';
import { ZohoWebhookDto } from '../dto/zoho-webhook.dto';

@Injectable()
export class ZohoWebhookService {
  private readonly logger = new Logger(ZohoWebhookService.name);

  async processWebhook(payload: ZohoWebhookDto, eventType: string): Promise<void> {
    this.logger.log(`Processing Zoho webhook event: ${eventType}`);

    try {
      switch (eventType) {
        case ZOHO_EVENT_TYPES.CONTACT_CREATED:
        case ZOHO_EVENT_TYPES.CONTACT_UPDATED:
          await this.handleContactEvent(payload);
          break;

        case ZOHO_EVENT_TYPES.LEAD_CREATED:
        case ZOHO_EVENT_TYPES.LEAD_UPDATED:
          await this.handleLeadEvent(payload);
          break;

        case ZOHO_EVENT_TYPES.DEAL_CREATED:
        case ZOHO_EVENT_TYPES.DEAL_UPDATED:
          await this.handleDealEvent(payload);
          break;

        default:
          this.logger.warn(`Unhandled webhook event type: ${eventType}`);
          // Don't throw error for unhandled events - just log them
          this.logger.debug(`Payload: ${JSON.stringify(payload)}`);
      }
    } catch (error) {
      this.logger.error(
        `Error processing webhook event ${eventType}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async handleContactEvent(payload: ZohoWebhookDto): Promise<void> {
    this.logger.log('Processing contact event', JSON.stringify(payload));
    // TODO: Implement your business logic here
    // Example: Update/create contact in your database
    // const contactData = payload.data;
    // await this.prisma.contact.upsert({ ... });
  }

  private async handleLeadEvent(payload: ZohoWebhookDto): Promise<void> {
    this.logger.log('Processing lead event', JSON.stringify(payload));
    // TODO: Implement your business logic here
    // Example: Update/create lead in your database
  }

  private async handleDealEvent(payload: ZohoWebhookDto): Promise<void> {
    this.logger.log('Processing deal event', JSON.stringify(payload));
    // TODO: Implement your business logic here
    // Example: Update/create deal in your database
  }
}
