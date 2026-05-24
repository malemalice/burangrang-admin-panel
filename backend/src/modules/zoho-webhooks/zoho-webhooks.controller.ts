import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../shared/decorators/public.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SETTINGS_KEYS } from '../settings/constants/settings-keys';
import { ZohoWebhookDto, ZohoWebhookResponseDto } from './dto/zoho-webhook.dto';
import { ZohoWebhookGuard } from './guards/zoho-webhook.guard';
import { ZohoConfigService } from './services/zoho-config.service';
import { ZohoDeskApiClient } from './services/zoho-desk-api.client';
import { ZohoWebhookService } from './services/zoho-webhook.service';

@ApiTags('zoho-webhooks')
@Controller()
export class ZohoWebhooksController {
  private readonly logger = new Logger(ZohoWebhooksController.name);

  constructor(
    private readonly webhookService: ZohoWebhookService,
    private readonly zohoConfigService: ZohoConfigService,
    private readonly zohoDeskApiClient: ZohoDeskApiClient,
    private readonly prisma: PrismaService,
  ) { }

  @Get('integrations/zoho/health')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Zoho integration health and config status' })
  @ApiResponse({ status: 200, description: 'Zoho integration health data' })
  async getZohoHealth() {
    const [syncEnabled, webhookEnabled, authMode, secret, authtoken, baseUrl, deptId, userId] =
      await Promise.all([
        this.zohoConfigService.getBoolean(SETTINGS_KEYS.ZOHO_SYNC_ENABLED, false),
        this.zohoConfigService.getBoolean(SETTINGS_KEYS.ZOHO_WEBHOOK_ENABLED, false),
        this.zohoConfigService.getWebhookAuthMode(),
        this.zohoConfigService.getString(SETTINGS_KEYS.ZOHO_WEBHOOK_SECRET, ''),
        this.zohoConfigService.getString(SETTINGS_KEYS.SDP_AUTHTOKEN, ''),
        this.zohoConfigService.getString(SETTINGS_KEYS.SDP_BASE_URL, ''),
        this.zohoConfigService.getString(SETTINGS_KEYS.ZOHO_DEFAULT_DEPARTMENT_ID, ''),
        this.zohoConfigService.getString(SETTINGS_KEYS.ZOHO_INTEGRATION_USER_ID, ''),
      ]);

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [recentWebhookLogCount, pendingJobCount, deadLetterJobCount, connectionTest] =
      await Promise.all([
        this.prisma.tZohoWebhookLogs.count({ where: { createdAt: { gte: since } } }),
        this.prisma.zohoOutboundJob.count({
          where: { status: { in: ['PENDING', 'FAILED_RETRY'] } },
        }),
        this.prisma.zohoOutboundJob.count({ where: { status: 'FAILED_DEAD_LETTER' } }),
        this.zohoDeskApiClient.testConnection(),
      ]);

    return {
      configStatus: {
        webhookEnabled,
        syncEnabled,
        authMode,
        hasWebhookSecret: secret.length > 0,
        hasSdpAuthtoken: authtoken.length > 0,
        hasSdpBaseUrl: baseUrl.length > 0,
        hasDefaultDepartmentId: deptId.length > 0,
        hasIntegrationUserId: userId.length > 0,
      },
      connectionTest,
      recentWebhookLogCount,
      pendingJobCount,
      deadLetterJobCount,
    };
  }

  @Post('integrations/zoho/webhook')
  @Public()
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
  @Public()
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
