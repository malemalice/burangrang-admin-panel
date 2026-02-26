import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../shared/decorators/public.decorator';
import { ZohoWebhookDto, ZohoWebhookResponseDto } from './dto/zoho-webhook.dto';
import { ZohoWebhookGuard } from './guards/zoho-webhook.guard';
import { ZohoWebhookService } from './services/zoho-webhook.service';

@ApiTags('zoho-webhooks')
@Controller()
@Public()
export class ZohoWebhooksController {
  private readonly logger = new Logger(ZohoWebhooksController.name);

  constructor(private readonly webhookService: ZohoWebhookService) { }

  @Post('integrations/zoho/webhook')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ZohoWebhookGuard)
  @ApiOperation({ summary: 'Receive Zoho webhook events (primary route)' })
  @ApiHeader({
    name: 'X-Zoho-Webhook-Secret',
    required: false,
    description: 'Secret header when ZOHO_WEBHOOK_AUTH_MODE=secret',
  })
  @ApiHeader({
    name: 'X-Zoho-Signature',
    required: false,
    description: 'HMAC SHA256 signature when ZOHO_WEBHOOK_AUTH_MODE=signature',
  })
  @ApiHeader({
    name: 'Authorization',
    required: false,
    description: 'Bearer JWT when ZOHO_WEBHOOK_AUTH_MODE=jwt',
  })
  @ApiHeader({
    name: 'X-Zoho-Request-Id',
    required: false,
    description: 'Optional request id for idempotency',
  })
  @ApiHeader({
    name: 'X-Zoho-Event',
    required: true,
    description: 'Zoho event type (Ticket_Add)',
  })
  @ApiHeader({
    name: 'X-Correlation-Id',
    required: false,
    description: 'Optional correlation id',
  })
  @ApiBody({ type: ZohoWebhookDto })
  @ApiResponse({
    status: 200,
    description: 'Webhook accepted for asynchronous processing',
    type: ZohoWebhookResponseDto,
  })
  async handlePrimaryWebhook(
    @Body() payload: ZohoWebhookDto,
    @Headers('x-zoho-request-id') requestId: string | undefined,
    @Headers('x-zoho-event') eventType: string | undefined,
    @Headers('x-correlation-id') correlationId: string | undefined,
  ): Promise<ZohoWebhookResponseDto> {
    return this.webhookService.receiveWebhook(
      payload,
      eventType,
      requestId,
      correlationId,
      false,
    );
  }

  @Post('webhooks/zoho')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ZohoWebhookGuard)
  @ApiOperation({
    summary: 'Receive Zoho webhook events (legacy compatibility route)',
  })
  @ApiBody({ type: ZohoWebhookDto })
  @ApiResponse({
    status: 200,
    description: 'Webhook accepted for asynchronous processing',
    type: ZohoWebhookResponseDto,
  })
  async handleLegacyWebhook(
    @Body() payload: ZohoWebhookDto,
    @Headers('x-zoho-request-id') requestId: string | undefined,
    @Headers('x-zoho-event') eventType: string | undefined,
    @Headers('x-correlation-id') correlationId: string | undefined,
  ): Promise<ZohoWebhookResponseDto> {
    this.logger.warn(
      '[DEPRECATION] Legacy route /webhooks/zoho is used. Please migrate to /integrations/zoho/webhook',
    );

    return this.webhookService.receiveWebhook(
      payload,
      eventType,
      requestId,
      correlationId,
      true,
    );
  }
}
