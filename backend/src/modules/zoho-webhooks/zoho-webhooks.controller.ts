import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
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

  @Get('integrations/zoho/test-inbound')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate inbound webhook configuration (no DB writes)' })
  @ApiResponse({ status: 200, description: 'Inbound config validation result' })
  async testInboundConfig() {
    const [webhookEnabled, authMode, secret, jwtToken, deptId, userId] = await Promise.all([
      this.zohoConfigService.getBoolean(SETTINGS_KEYS.ZOHO_WEBHOOK_ENABLED, false),
      this.zohoConfigService.getWebhookAuthMode(),
      this.zohoConfigService.getString(SETTINGS_KEYS.ZOHO_WEBHOOK_SECRET, ''),
      this.zohoConfigService.getString(SETTINGS_KEYS.ZOHO_WEBHOOK_JWT, ''),
      this.zohoConfigService.getString(SETTINGS_KEYS.ZOHO_DEFAULT_DEPARTMENT_ID, ''),
      this.zohoConfigService.getString(SETTINGS_KEYS.ZOHO_INTEGRATION_USER_ID, ''),
    ]);

    const validModes = ['secret', 'signature', 'jwt'];
    const hasAuthMode = validModes.includes(authMode);
    const usesSecret = authMode === 'secret' || authMode === 'signature';
    const hasSecret = usesSecret ? secret.length > 0 : null;
    const hasJwt = authMode === 'jwt' ? jwtToken.length > 0 : null;
    const hasDefaultDepartmentId = deptId.length > 0;
    const hasIntegrationUserId = userId.length > 0;

    const issues: string[] = [];
    if (!webhookEnabled) issues.push('Inbound webhook is disabled');
    if (!hasAuthMode) issues.push(`Unknown auth mode "${authMode}"`);
    if (hasSecret === false) issues.push('Webhook secret is not configured');
    if (hasJwt === false) issues.push('Webhook JWT token is not configured');
    if (!hasDefaultDepartmentId) issues.push('Default Department ID is missing');
    if (!hasIntegrationUserId) issues.push('Integration User ID is missing');

    return {
      ok: issues.length === 0,
      authMode,
      checks: {
        webhookEnabled,
        hasAuthMode,
        hasSecret,
        hasJwt,
        hasDefaultDepartmentId,
        hasIntegrationUserId,
      },
      issues,
    };
  }

  @Get('integrations/zoho/test-outbound')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Test live connection to Zoho SDP API' })
  @ApiResponse({ status: 200, description: 'Outbound connection test result' })
  async testOutboundConnection() {
    return this.zohoDeskApiClient.testConnection();
  }

  @Get('integrations/zoho/health')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Zoho integration health and config status' })
  @ApiResponse({ status: 200, description: 'Zoho integration health data' })
  async getZohoHealth() {
    const [syncEnabled, webhookEnabled, authMode, secret, authtoken, baseUrl, deptId, userId, areaId, riskCategoryId] =
      await Promise.all([
        this.zohoConfigService.getBoolean(SETTINGS_KEYS.ZOHO_SYNC_ENABLED, false),
        this.zohoConfigService.getBoolean(SETTINGS_KEYS.ZOHO_WEBHOOK_ENABLED, false),
        this.zohoConfigService.getWebhookAuthMode(),
        this.zohoConfigService.getString(SETTINGS_KEYS.ZOHO_WEBHOOK_SECRET, ''),
        this.zohoConfigService.getString(SETTINGS_KEYS.SDP_AUTHTOKEN, ''),
        this.zohoConfigService.getString(SETTINGS_KEYS.SDP_BASE_URL, ''),
        this.zohoConfigService.getString(SETTINGS_KEYS.ZOHO_DEFAULT_DEPARTMENT_ID, ''),
        this.zohoConfigService.getString(SETTINGS_KEYS.ZOHO_INTEGRATION_USER_ID, ''),
        this.zohoConfigService.getString(SETTINGS_KEYS.ZOHO_DEFAULT_AREA_ID, ''),
        this.zohoConfigService.getString(SETTINGS_KEYS.ZOHO_DEFAULT_RISK_CATEGORY_ID, ''),
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
        hasDefaultAreaId: areaId.length > 0,
        hasDefaultRiskCategoryId: riskCategoryId.length > 0,
      },
      connectionTest,
      recentWebhookLogCount,
      pendingJobCount,
      deadLetterJobCount,
    };
  }

  @Get('integrations/zoho/field-values')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Discover distinct Zoho field values from recent webhook logs' })
  @ApiResponse({ status: 200, description: 'Distinct Zoho field values seen in recent processed Ticket_Add logs' })
  async discoverFieldValues() {
    return this.webhookService.discoverFieldValues();
  }

  @Get('integrations/zoho/jobs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List outbound sync jobs (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated outbound job list' })
  async listJobs(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
  ) {
    return this.webhookService.listOutboundJobs({
      page: Math.max(1, parseInt(page, 10) || 1),
      limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 20)),
      status: status?.trim() || undefined,
    });
  }

  @Post('integrations/zoho/jobs/:id/retry')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retry a dead-letter outbound job' })
  @ApiResponse({ status: 200, description: 'Job reset to PENDING' })
  async retryJob(@Param('id') id: string) {
    await this.webhookService.retryDeadLetterJob(id);
    return { ok: true };
  }

  @Get('integrations/zoho/webhook-logs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List inbound webhook logs (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated webhook log list' })
  async listWebhookLogs(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
  ) {
    return this.webhookService.listWebhookLogs({
      page: Math.max(1, parseInt(page, 10) || 1),
      limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 20)),
      status: status?.trim() || undefined,
    });
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
