import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { FindPaymentsDto } from './dto/find-payments.dto';
import { PaymentDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Public } from '../../shared/decorators/public.decorator';
import { Role } from '../../shared/types/role.enum';
import { XenditService } from '../../shared/services/xendit.service';
import { XenditQRCodeWebhookPayload } from '../../shared/types/xendit.types';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly xenditService: XenditService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all payments with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'orderId', required: false, type: String })
  @ApiQuery({ name: 'transactionId', required: false, type: String })
  @ApiResponse({ status: 200, type: [PaymentDto] })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER)
  async findAll(@Query() query: FindPaymentsDto) {
    return this.paymentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: PaymentDto })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER, Role.USER)
  async findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Get('transaction/:transactionId')
  @ApiOperation({ summary: 'Get payment by transaction ID' })
  @ApiParam({ name: 'transactionId', type: String })
  @ApiResponse({ status: 200, type: PaymentDto })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER, Role.USER)
  async findByTransactionId(@Param('transactionId') transactionId: string) {
    return this.paymentsService.findByTransactionId(transactionId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new payment' })
  @ApiResponse({ status: 201, type: PaymentDto })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER)
  async create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update payment' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: PaymentDto })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ) {
    return this.paymentsService.update(id, updatePaymentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete payment' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Payment deleted successfully' })
  @Roles(Role.SUPER_ADMIN)
  async remove(@Param('id') id: string) {
    return this.paymentsService.remove(id);
  }

  /**
   * Xendit QRIS Webhook Endpoint
   * Receives payment status updates from Xendit QRIS QR Code payments
   *
   * Webhook format based on Xendit API 2022-07-31
   * Event: qr.payment
   */
  @Post('webhook/xendit')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xendit webhook for QRIS QR Code payment status updates',
    description:
      'Handles qr.payment event from Xendit when QRIS payment is completed. ' +
      'Verifies webhook authenticity using x-callback-token header (must match XENDIT_WEBHOOK_TOKEN in .env).',
  })
  @ApiBody({
    description: 'Xendit QRIS webhook payload',
    schema: {
      type: 'object',
      required: ['created', 'business_id', 'event', 'data', 'api_version'],
      properties: {
        created: { type: 'string', example: '2025-10-12T13:16:54.859Z' },
        business_id: { type: 'string', example: '670484e3e91755a865dfad36' },
        event: { type: 'string', enum: ['qr.payment'], example: 'qr.payment' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'qrpy_d44280fc-25c8-4b37-a095-849ce33dd970' },
            type: { type: 'string', enum: ['DYNAMIC', 'STATIC'], example: 'DYNAMIC' },
            qr_id: { type: 'string', example: 'qr_2af87464-7e69-404c-b309-7368f1fcfecd' },
            amount: { type: 'number', example: 300 },
            status: { type: 'string', enum: ['SUCCEEDED', 'FAILED'], example: 'SUCCEEDED' },
            currency: { type: 'string', example: 'IDR' },
            reference_id: { type: 'string', example: 'ORD-1760274607146-KP2C1CRWN' },
            payment_detail: {
              type: 'object',
              properties: {
                source: { type: 'string', example: 'DANA' },
              },
            },
          },
        },
        api_version: { type: 'string', example: '2022-07-31' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid webhook signature or event type',
  })
  async handleXenditWebhook(
    @Body() webhookData: XenditQRCodeWebhookPayload,
    @Headers('x-callback-token') callbackToken: string,
  ): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const webhookEvent = (webhookData as any)?.event || 'unknown';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const webhookStatus = (webhookData as any)?.data?.status || 'unknown';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const referenceId = (webhookData as any)?.data?.reference_id || 'unknown';

    this.logger.log(
      `Received Xendit webhook - Event: ${webhookEvent}, Status: ${webhookStatus}, Reference: ${referenceId}`,
    );

    // Verify webhook using x-callback-token header
    const isValid = this.xenditService.verifyWebhookSignature(callbackToken);
    
    if (!isValid) {
      this.logger.error('Webhook verification failed - invalid or missing x-callback-token');
      throw new BadRequestException('Invalid webhook token');
    }

    // Validate event type
    if (webhookEvent !== 'qr.payment') {
      this.logger.warn(`Unhandled webhook event: ${webhookEvent}`);
      throw new BadRequestException(`Unsupported event type: ${webhookEvent}`);
    }

    // Process QRIS payment webhook
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const amount = (webhookData as any).data.amount;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const paymentSource = (webhookData as any).data.payment_detail.source;

      this.logger.log(
        `Processing QRIS payment - Reference: ${referenceId}, ` +
          `Amount: ${amount}, Status: ${webhookStatus}, ` +
          `Source: ${paymentSource}`,
      );

      if (webhookStatus === 'SUCCEEDED') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        await this.paymentsService.handleQRCodePaid(webhookData);
        this.logger.log(`QRIS payment processed successfully: ${referenceId}`);
      } else if (webhookStatus === 'FAILED') {
        this.logger.warn(`QRIS payment failed: ${referenceId}`);
        // Could add handleQRCodeFailed if needed
      } else {
        this.logger.warn(`Unhandled QRIS payment status: ${webhookStatus}`);
      }

      return {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        received: true,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        event: webhookEvent,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        status: webhookStatus,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        reference_id: referenceId,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error processing QRIS webhook: ${errorMessage}`,
        errorStack,
      );
      // Return 200 to prevent Xendit from retrying
      return {
        received: true,
        error: 'Processing error',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        reference_id: referenceId,
      };
    }
  }
}

