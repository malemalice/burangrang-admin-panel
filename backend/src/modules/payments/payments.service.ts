import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { XenditService } from '../../shared/services/xendit.service';
import { PaymentDto } from './dto/payment.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { XenditQRCodeWebhookPayload } from '../../shared/types/xendit.types';

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
   * Handle Xendit QRIS QR Code Payment Webhook
   * 
   * Processes successful QRIS payments and updates:
   * - Payment status to COMPLETED (t_payments)
   * - Order status to FULFILLED (t_orders) - User now has access
   * - Creates course enrollments (t_enrollments)
   * 
   * References ERD:
   * - t_orders: orderNumber → webhookData.data.reference_id
   * - t_payments: orderId, transactionId, status, gatewayResponse
   * - t_customers: userId for enrollment
   * - t_enrollments: userId, courseId, orderId, status
   */
  async handleQRCodePaid(webhookData: XenditQRCodeWebhookPayload): Promise<void> {
    return this.errorHandler.safeExecute(async () => {
      const referenceId = webhookData.data.reference_id;
      const paymentId = webhookData.data.id;
      const amount = webhookData.data.amount;
      const paymentSource = webhookData.data.payment_detail.source;

      this.logger.log(
        `Processing QRIS payment - Reference: ${referenceId}, ` +
        `Payment ID: ${paymentId}, Amount: ${amount}, Source: ${paymentSource}`
      );

      // Find order by order number (reference_id)
      // ERD Reference: t_orders.orderNumber
      const order = await this.prisma.order.findUnique({
        where: { orderNumber: referenceId },
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
        this.logger.error(`Order not found for reference_id: ${referenceId}`);
        return;
      }

      this.logger.log(`Found order ${order.id} for customer ${order.customer.user.email}`);

      // Find payment for this order
      // ERD Reference: t_payments.orderId
      const payment = await this.prisma.payment.findFirst({
        where: { orderId: order.id },
      });

      if (!payment) {
        this.logger.error(`Payment not found for order: ${order.id}`);
        return;
      }

      // Update payment status to COMPLETED
      // ERD Reference: t_payments (status, processedAt, gatewayResponse)
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
          gatewayResponse: webhookData as any,
        },
      });

      this.logger.log(`Payment ${payment.id} updated to COMPLETED`);

      // Update order status to FULFILLED (user now has access)
      // ERD Reference: t_orders (status, paymentStatus)
      // TRD Reference: Order Status Management - FULFILLED means user has access
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'FULFILLED', // ✅ User has access to digital products
          paymentStatus: 'PAID',
        },
      });

      this.logger.log(`Order ${order.id} status updated to FULFILLED`);

      // Create enrollments for course items
      // ERD Reference: t_enrollments (userId, courseId, orderId, status)
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
                enrolledAt: new Date(),
              },
            });

            this.logger.log(
              `✅ Created enrollment for user ${order.customer.user.email} ` +
              `(${order.customer.userId}) in course ${item.course.title} (${item.courseId})`
            );
          } else {
            this.logger.log(
              `Enrollment already exists for user ${order.customer.user.email} ` +
              `in course ${item.course.title}`
            );
          }
        }
      }

      this.logger.log(
        `✅ QRIS payment processed successfully - Reference: ${referenceId}, ` +
        `Order: ${order.orderNumber}, Amount: ${amount} ${webhookData.data.currency}, ` +
        `Payment Source: ${paymentSource}`
      );
    }, 'Handling QRIS QR Code paid webhook');
  }
}

