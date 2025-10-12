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
import { XenditWebhookPayload, XenditQRCodeWebhookPayload } from '../../shared/types/xendit.types';

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
  async update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
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
   * Xendit Webhook Endpoint
   * Receives payment status updates from Xendit (Invoice and QR Code)
   */
  @Post('webhook/xendit')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xendit webhook for payment status updates (Invoice and QRIS QR Code)' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async handleXenditWebhook(
    @Body() webhookData: XenditWebhookPayload | XenditQRCodeWebhookPayload,
    @Headers('x-callback-token') callbackToken: string,
  ) {
    this.logger.log(`Received Xendit webhook with status: ${webhookData.status}`);

    // Verify webhook signature
    const isValid = this.xenditService.verifyWebhookSignature(callbackToken);
    if (!isValid) {
      this.logger.error('Invalid webhook signature');
      throw new BadRequestException('Invalid webhook signature');
    }

    // Process webhook based on type and status
    try {
      // Check if it's a QR Code webhook (has qr_string field)
      if ('qr_string' in webhookData) {
        // QRIS QR Code webhook
        this.logger.log(`Processing QRIS QR Code webhook: ${webhookData.reference_id}`);
        
        if (webhookData.status === 'COMPLETED') {
          await this.paymentsService.handleQRCodePaid(webhookData);
        }
      } else {
        // Invoice webhook
        this.logger.log(`Processing Invoice webhook: ${webhookData.external_id}`);
        
        switch (webhookData.status) {
          case 'PAID':
            await this.paymentsService.handleInvoicePaid(webhookData);
            break;
          case 'EXPIRED':
            await this.paymentsService.handleInvoiceExpired(webhookData);
            break;
          default:
            this.logger.warn(`Unhandled webhook status: ${webhookData.status}`);
        }
      }

      return { received: true, status: webhookData.status };
    } catch (error) {
      this.logger.error('Error processing webhook:', error);
      // Return 200 to prevent Xendit from retrying
      return { received: true, error: 'Processing error' };
    }
  }
}

