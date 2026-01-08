import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiBody,
} from '@nestjs/swagger';
import { Public } from '../../shared/decorators/public.decorator';
import { ZohoWebhookGuard } from './guards/zoho-webhook.guard';
import { ZohoWebhookService } from './services/zoho-webhook.service';
import { ZohoWebhookValidatorService } from './services/zoho-webhook-validator.service';
import { ZohoWebhookDto, ZohoWebhookResponseDto } from './dto/zoho-webhook.dto';

@ApiTags('zoho-webhooks')
@Controller('webhooks/zoho')
@Public() // Bypass JWT authentication
export class ZohoWebhooksController {
  private readonly logger = new Logger(ZohoWebhooksController.name);

  constructor(
    private readonly webhookService: ZohoWebhookService,
    private readonly validatorService: ZohoWebhookValidatorService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(ZohoWebhookGuard) // Apply signature verification (if enabled)
  @ApiOperation({ summary: 'Receive Zoho webhook events' })
  @ApiHeader({
    name: 'X-Zoho-Signature',
    description: 'HMAC-SHA256 signature of the request body',
    required: false,
  })
  @ApiHeader({
    name: 'X-Zoho-Request-Id',
    description: 'Unique request ID for idempotency',
    required: false,
  })
  @ApiHeader({
    name: 'X-Zoho-Event',
    description: 'Event type (e.g., contact.created, lead.updated)',
    required: false,
  })
  @ApiBody({ type: ZohoWebhookDto })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
    type: ZohoWebhookResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request or processing error' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Missing or invalid signature' })
  @ApiResponse({ status: 403, description: 'Forbidden - Invalid signature' })
  async handleWebhook(
    @Body() payload: ZohoWebhookDto,
    @Headers('x-zoho-request-id') requestId: string,
    @Headers('x-zoho-event') eventType: string,
  ): Promise<ZohoWebhookResponseDto> {
    this.logger.log(`Received Zoho webhook: ${eventType || 'unknown'}, RequestId: ${requestId || 'none'}`);

    // Check for duplicate requests (idempotency)
    if (requestId) {
      const isDuplicate = await this.validatorService.isDuplicate(requestId);
      if (isDuplicate) {
        await this.validatorService.logWebhook(
          requestId,
          eventType || 'unknown',
          'duplicate',
          payload,
        );
        this.logger.warn(`Duplicate webhook request ignored: ${requestId}`);
        return {
          status: 'ok',
          message: 'Duplicate request ignored',
        };
      }
    }

    try {
      // Process webhook based on event type
      await this.webhookService.processWebhook(payload, eventType || 'unknown');

      // Log successful processing
      await this.validatorService.logWebhook(
        requestId || `no-id-${Date.now()}`,
        eventType || 'unknown',
        'processed',
        payload,
      );

      this.logger.log(`Webhook processed successfully: ${eventType || 'unknown'}`);
      return {
        status: 'ok',
        message: 'Webhook processed successfully',
      };
    } catch (error) {
      // Log failed processing
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.validatorService.logWebhook(
        requestId || `no-id-${Date.now()}`,
        eventType || 'unknown',
        'failed',
        payload,
        errorMessage,
      );

      this.logger.error(`Failed to process webhook: ${errorMessage}`, error.stack);
      throw new BadRequestException(`Failed to process webhook: ${errorMessage}`);
    }
  }
}
