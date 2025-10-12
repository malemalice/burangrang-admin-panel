import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { XenditService } from '../../shared/services/xendit.service';
import { PaymentDto } from './dto/payment.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { XenditWebhookPayload, XenditQRCodeWebhookPayload } from '../../shared/types/xendit.types';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: string;
  orderId?: string;
  transactionId?: string;
  paymentMethodId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private paymentMapper: (entity: any) => PaymentDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
    private readonly xenditService: XenditService,
  ) {
    this.paymentMapper = this.dtoMapper.createSimpleMapper(PaymentDto);
  }

  async findAll(options: FindAllOptions): Promise<PaginatedResponse<PaymentDto>> {
    return this.errorHandler.safeExecute(async () => {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
        status,
        orderId,
        transactionId,
        paymentMethodId,
      } = options;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (search) {
        where.OR = [
          { transactionId: { contains: search, mode: 'insensitive' } },
          { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
        ];
      }

      if (status) {
        where.status = status;
      }

      if (orderId) {
        where.orderId = orderId;
      }

      if (transactionId) {
        where.transactionId = transactionId;
      }

      if (paymentMethodId) {
        where.paymentMethodId = paymentMethodId;
      }

      // Get total count
      const total = await this.prisma.payment.count({ where });

      // Get paginated data
      const payments = await this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          order: true,
          paymentMethod: true,
        },
      });

      return {
        data: payments.map(this.paymentMapper),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }, 'Finding all payments');
  }

  async findOne(id: string): Promise<PaymentDto> {
    return this.errorHandler.safeExecute(async () => {
      const payment = await this.prisma.payment.findUnique({
        where: { id },
        include: {
          order: {
            include: {
              customer: {
                include: { user: true },
              },
              items: true,
            },
          },
          paymentMethod: true,
        },
      });

      this.errorHandler.throwIfNotFoundById('Payment', id, payment);

      return this.paymentMapper(payment);
    }, 'Finding payment by ID');
  }

  async findByTransactionId(transactionId: string): Promise<PaymentDto> {
    return this.errorHandler.safeExecute(async () => {
      const payment = await this.prisma.payment.findUnique({
        where: { transactionId },
        include: {
          order: {
            include: {
              customer: {
                include: { user: true },
              },
              items: true,
            },
          },
          paymentMethod: true,
        },
      });

      this.errorHandler.throwIfNotFound(
        'Payment',
        `transaction ID ${transactionId}`,
        payment,
      );

      return this.paymentMapper(payment);
    }, 'Finding payment by transaction ID');
  }

  async create(createPaymentDto: CreatePaymentDto): Promise<PaymentDto> {
    return this.errorHandler.safeExecute(async () => {
      // Validate order exists
      const order = await this.prisma.order.findUnique({
        where: { id: createPaymentDto.orderId },
      });

      this.errorHandler.throwIfNotFoundById('Order', createPaymentDto.orderId, order);

      // Validate payment method exists
      const paymentMethod = await this.prisma.paymentMethod.findUnique({
        where: { id: createPaymentDto.paymentMethodId },
      });

      this.errorHandler.throwIfNotFoundById(
        'Payment Method',
        createPaymentDto.paymentMethodId,
        paymentMethod,
      );

      // Create payment
      const payment = await this.prisma.payment.create({
        data: {
          orderId: createPaymentDto.orderId,
          paymentMethodId: createPaymentDto.paymentMethodId,
          transactionId: createPaymentDto.transactionId,
          amount: createPaymentDto.amount,
          currency: createPaymentDto.currency || 'IDR',
          status: createPaymentDto.status || 'PENDING',
          gatewayResponse: createPaymentDto.gatewayResponse,
        },
        include: {
          order: true,
          paymentMethod: true,
        },
      });

      this.logger.log(`Payment created: ${payment.id} for order ${order.orderNumber}`);

      return this.paymentMapper(payment);
    }, 'Creating payment');
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto): Promise<PaymentDto> {
    return this.errorHandler.safeExecute(async () => {
      // Verify payment exists
      const existingPayment = await this.prisma.payment.findUnique({
        where: { id },
      });

      this.errorHandler.throwIfNotFoundById('Payment', id, existingPayment);

      // Update payment
      const payment = await this.prisma.payment.update({
        where: { id },
        data: {
          ...updatePaymentDto,
          ...(updatePaymentDto.status === 'COMPLETED' && {
            processedAt: new Date(),
          }),
        },
        include: {
          order: true,
          paymentMethod: true,
        },
      });

      this.logger.log(`Payment updated: ${payment.id}`);

      return this.paymentMapper(payment);
    }, 'Updating payment');
  }

  async remove(id: string): Promise<void> {
    return this.errorHandler.safeExecute(async () => {
      const payment = await this.prisma.payment.findUnique({
        where: { id },
      });

      this.errorHandler.throwIfNotFoundById('Payment', id, payment);

      await this.prisma.payment.delete({
        where: { id },
      });

      this.logger.log(`Payment deleted: ${id}`);
    }, 'Deleting payment');
  }

  /**
   * Handle Xendit webhook for invoice paid
   */
  async handleInvoicePaid(webhookData: XenditWebhookPayload): Promise<void> {
    return this.errorHandler.safeExecute(async () => {
      this.logger.log(`Processing paid invoice: ${webhookData.external_id}`);

      // Find order by order number (external_id)
      const order = await this.prisma.order.findUnique({
        where: { orderNumber: webhookData.external_id },
        include: {
          items: {
            include: {
              course: true,
            },
          },
          customer: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!order) {
        this.logger.error(`Order not found for external_id: ${webhookData.external_id}`);
        return;
      }

      // Find payment for this order
      const payment = await this.prisma.payment.findFirst({
        where: { orderId: order.id },
      });

      if (!payment) {
        this.logger.error(`Payment not found for order: ${order.id}`);
        return;
      }

      // Update payment status
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
          gatewayResponse: webhookData as any,
        },
      });

      // Update order status
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
        },
      });

      // Create enrollments for course items
      for (const item of order.items) {
        if (item.courseId && item.course) {
          const existingEnrollment = await this.prisma.enrollment.findUnique({
            where: {
              userId_courseId: {
                userId: order.customer.userId,
                courseId: item.courseId,
              },
            },
          });

          if (!existingEnrollment) {
            await this.prisma.enrollment.create({
              data: {
                userId: order.customer.userId,
                courseId: item.courseId,
                orderId: order.id,
                status: 'ACTIVE',
              },
            });
            this.logger.log(
              `Enrollment created for user ${order.customer.userId} in course ${item.courseId}`,
            );
          }
        }
      }

      this.logger.log(`Invoice paid processed successfully: ${webhookData.external_id}`);
    }, 'Handling invoice paid webhook');
  }

  /**
   * Handle Xendit webhook for invoice expired
   */
  async handleInvoiceExpired(webhookData: XenditWebhookPayload): Promise<void> {
    return this.errorHandler.safeExecute(async () => {
      this.logger.log(`Processing expired invoice: ${webhookData.external_id}`);

      // Find order by order number
      const order = await this.prisma.order.findUnique({
        where: { orderNumber: webhookData.external_id },
      });

      if (!order) {
        this.logger.error(`Order not found for external_id: ${webhookData.external_id}`);
        return;
      }

      // Find payment for this order
      const payment = await this.prisma.payment.findFirst({
        where: { orderId: order.id },
      });

      if (!payment) {
        this.logger.error(`Payment not found for order: ${order.id}`);
        return;
      }

      // Update payment status
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'CANCELLED',
          gatewayResponse: webhookData as any,
        },
      });

      // Update order status
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'FAILED',
        },
      });

      this.logger.log(`Invoice expired processed successfully: ${webhookData.external_id}`);
    }, 'Handling invoice expired webhook');
  }

  /**
   * Handle Xendit webhook for payment failed
   */
  async handlePaymentFailed(webhookData: XenditWebhookPayload): Promise<void> {
    return this.errorHandler.safeExecute(async () => {
      this.logger.log(`Processing failed payment: ${webhookData.external_id}`);

      // Find order by order number
      const order = await this.prisma.order.findUnique({
        where: { orderNumber: webhookData.external_id },
      });

      if (!order) {
        this.logger.error(`Order not found for external_id: ${webhookData.external_id}`);
        return;
      }

      // Find payment for this order
      const payment = await this.prisma.payment.findFirst({
        where: { orderId: order.id },
      });

      if (!payment) {
        this.logger.error(`Payment not found for order: ${order.id}`);
        return;
      }

      // Update payment status
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          gatewayResponse: webhookData as any,
        },
      });

      // Update order status
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'PAYMENT_FAILED',
          paymentStatus: 'FAILED',
        },
      });

      this.logger.log(`Payment failed processed successfully: ${webhookData.external_id}`);
    }, 'Handling payment failed webhook');
  }

  /**
   * Handle Xendit webhook for QRIS QR Code paid
   */
  async handleQRCodePaid(webhookData: XenditQRCodeWebhookPayload): Promise<void> {
    return this.errorHandler.safeExecute(async () => {
      this.logger.log(`Processing QRIS QR Code payment: ${webhookData.reference_id}`);

      // Find order by order number (reference_id)
      const order = await this.prisma.order.findUnique({
        where: { orderNumber: webhookData.reference_id },
        include: {
          items: {
            include: {
              course: true,
            },
          },
          customer: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!order) {
        this.logger.error(`Order not found for reference_id: ${webhookData.reference_id}`);
        return;
      }

      // Find payment for this order
      const payment = await this.prisma.payment.findFirst({
        where: { orderId: order.id },
      });

      if (!payment) {
        this.logger.error(`Payment not found for order: ${order.id}`);
        return;
      }

      // Update payment status
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
          gatewayResponse: webhookData as any,
        },
      });

      // Update order status
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
        },
      });

      // Create enrollments for course items
      for (const item of order.items) {
        if (item.courseId && item.course) {
          // Check if enrollment already exists
          const existingEnrollment = await this.prisma.enrollment.findUnique({
            where: {
              userId_courseId: {
                userId: order.customer.userId,
                courseId: item.courseId,
              },
            },
          });

          // Create enrollment if doesn't exist
          if (!existingEnrollment) {
            await this.prisma.enrollment.create({
              data: {
                userId: order.customer.userId,
                courseId: item.courseId,
                orderId: order.id,
                status: 'ACTIVE',
              },
            });

            this.logger.log(
              `Created enrollment for user ${order.customer.userId} in course ${item.courseId}`,
            );
          } else {
            this.logger.log(
              `Enrollment already exists for user ${order.customer.userId} in course ${item.courseId}`,
            );
          }
        }
      }

      this.logger.log(`QRIS QR Code payment processed successfully: ${webhookData.reference_id}`);
    }, 'Handling QRIS QR Code paid webhook');
  }
}

