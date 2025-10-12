import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { OrderDto, OrderItemDto } from './dto/order.dto';
import { CreateOrderDto, CreateOrderItemDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { isValidStatusTransition, isValidOrderStatus } from 'src/shared/types';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: string;
  paymentStatus?: string;
  customerId?: string;
  orderNumber?: string;
}

@Injectable()
export class OrdersService {
  // Initialize mappers in constructor
  private orderMapper: (entity: any) => OrderDto;
  private orderItemMapper: (entity: any) => OrderItemDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
  ) {
    // Initialize orderItemMapper first
    this.orderItemMapper = this.dtoMapper.createRelationMapper(OrderItemDto, {
      product: {
        mapper: (product: any) => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          salePrice: product.salePrice,
          thumbnailUrl: product.thumbnailUrl,
        }),
        isArray: false,
      },
      course: {
        mapper: (course: any) => ({
          id: course.id,
          title: course.title,
          slug: course.slug,
          thumbnailUrl: course.thumbnailUrl,
          instructor: course.instructor
            ? {
                id: course.instructor.id,
                firstName: course.instructor.firstName,
                lastName: course.instructor.lastName,
              }
            : null,
        }),
        isArray: false,
      },
    });

    // Now initialize orderMapper with the already defined orderItemMapper
    this.orderMapper = this.dtoMapper.createRelationMapper(OrderDto, {
      customer: {
        mapper: (customer: any) => ({
          id: customer.id,
          userId: customer.userId,
          phone: customer.phone,
          address: customer.address,
          city: customer.city,
          state: customer.state,
          country: customer.country,
          postalCode: customer.postalCode,
          user: customer.user
            ? {
                id: customer.user.id,
                email: customer.user.email,
                firstName: customer.user.firstName,
                lastName: customer.user.lastName,
              }
            : null,
        }),
        isArray: false,
      },
      items: {
        mapper: this.orderItemMapper,
        isArray: true,
      },
      payments: {
        mapper: (payment: any) => ({
          id: payment.id,
          transactionId: payment.transactionId,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          processedAt: payment.processedAt,
        }),
        isArray: true,
      },
    });
  }

  async create(createOrderDto: CreateOrderDto): Promise<OrderDto> {
    return this.errorHandler.safeExecute(async () => {
      // Generate unique order number
      const orderNumber = await this.generateOrderNumber();

      // Validate customer exists
      const customer = await this.prisma.customer.findUnique({
        where: { id: createOrderDto.customerId },
        include: { user: true },
      });

      this.errorHandler.throwIfNotFoundById(
        'Customer',
        createOrderDto.customerId,
        customer,
      );

      // Validate order items
      await this.validateOrderItems(createOrderDto.items);

      // Create order with items
      const order = await this.prisma.order.create({
        data: {
          orderNumber,
          customerId: createOrderDto.customerId,
          status: createOrderDto.status || 'PENDING',
          subtotal: createOrderDto.subtotal,
          taxAmount: createOrderDto.taxAmount || 0,
          discountAmount: createOrderDto.discountAmount || 0,
          totalAmount: createOrderDto.totalAmount,
          currency: createOrderDto.currency || 'USD',
          paymentStatus: createOrderDto.paymentStatus || 'PENDING',
          shippingAddress: createOrderDto.shippingAddress,
          billingAddress: createOrderDto.billingAddress,
          notes: createOrderDto.notes,
          items: {
            create: createOrderDto.items.map((item) => ({
              productId: item.productId,
              courseId: item.courseId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            })),
          },
        },
        include: {
          customer: {
            include: { user: true },
          },
          items: {
            include: {
              product: true,
              course: {
                include: { instructor: true },
              },
            },
          },
          payments: true,
        },
      });

      return this.orderMapper(order);
    }, 'Creating order');
  }

  async findAll(
    options: FindAllOptions,
  ): Promise<{ data: OrderDto[]; meta: any }> {
    return this.errorHandler.safeExecute(async () => {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
        status,
        paymentStatus,
        customerId,
        orderNumber,
      } = options;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (search) {
        where.OR = [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          {
            customer: {
              user: { firstName: { contains: search, mode: 'insensitive' } },
            },
          },
          {
            customer: {
              user: { lastName: { contains: search, mode: 'insensitive' } },
            },
          },
          {
            customer: {
              user: { email: { contains: search, mode: 'insensitive' } },
            },
          },
        ];
      }

      if (status) {
        where.status = status;
      }

      if (paymentStatus) {
        where.paymentStatus = paymentStatus;
      }

      if (customerId) {
        where.customerId = customerId;
      }

      if (orderNumber) {
        where.orderNumber = { contains: orderNumber, mode: 'insensitive' };
      }

      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            customer: {
              include: { user: true },
            },
            items: {
              include: {
                product: true,
                course: {
                  include: { instructor: true },
                },
              },
            },
            payments: true,
          },
        }),
        this.prisma.order.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: orders.map((order) => this.orderMapper(order)),
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    }, 'Fetching orders');
  }

  async findOne(id: string): Promise<OrderDto> {
    return this.errorHandler.safeExecute(async () => {
      const order = await this.prisma.order.findUnique({
        where: { id },
        include: {
          customer: {
            include: { user: true },
          },
          items: {
            include: {
              product: true,
              course: {
                include: { instructor: true },
              },
            },
          },
          payments: true,
        },
      });

      this.errorHandler.throwIfNotFoundById('Order', id, order);

      return this.orderMapper(order);
    }, 'Fetching order');
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<OrderDto> {
    return this.errorHandler.safeExecute(async () => {
      // Check if order exists
      const existingOrder = await this.prisma.order.findUnique({
        where: { id },
      });

      this.errorHandler.throwIfNotFoundById('Order', id, existingOrder);

      // Validate status transitions
      if (
        updateOrderDto.status &&
        existingOrder.status !== updateOrderDto.status
      ) {
        console.log(
          `[OrdersService] Validating status transition from "${existingOrder.status}" to "${updateOrderDto.status}"`,
        );
        this.validateStatusTransition(
          existingOrder.status,
          updateOrderDto.status,
        );
      }

      const order = await this.prisma.order.update({
        where: { id },
        data: updateOrderDto,
        include: {
          customer: {
            include: { user: true },
          },
          items: {
            include: {
              product: true,
              course: {
                include: { instructor: true },
              },
            },
          },
          payments: true,
        },
      });

      return this.orderMapper(order);
    }, 'Updating order');
  }

  async remove(id: string): Promise<void> {
    return this.errorHandler.safeExecute(async () => {
      const order = await this.prisma.order.findUnique({
        where: { id },
      });

      this.errorHandler.throwIfNotFoundById('Order', id, order);

      // Check if order can be deleted (only pending orders)
      if (order.status !== 'PENDING') {
        throw new BadRequestException('Only pending orders can be deleted');
      }

      await this.prisma.order.delete({
        where: { id },
      });
    }, 'Deleting order');
  }

  async getOrderStats(): Promise<any> {
    return this.errorHandler.safeExecute(async () => {
      const [
        totalOrders,
        pendingOrders,
        paymentPendingOrders,
        paymentFailedOrders,
        confirmedOrders,
        fulfilledOrders,
        cancelledOrders,
        refundedOrders,
        totalRevenue,
        monthlyRevenue,
      ] = await Promise.all([
        this.prisma.order.count(),
        this.prisma.order.count({ where: { status: 'PENDING' } }),
        this.prisma.order.count({ where: { status: 'PAYMENT_PENDING' } }),
        this.prisma.order.count({ where: { status: 'PAYMENT_FAILED' } }),
        this.prisma.order.count({ where: { status: 'CONFIRMED' } }),
        this.prisma.order.count({ where: { status: 'FULFILLED' } }),
        this.prisma.order.count({ where: { status: 'CANCELLED' } }),
        this.prisma.order.count({ where: { status: 'REFUNDED' } }),
        this.prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: { status: { not: 'CANCELLED' } },
        }),
        this.prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: {
            status: { not: 'CANCELLED' },
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
      ]);

      return {
        totalOrders,
        pendingOrders,
        paymentPendingOrders,
        paymentFailedOrders,
        confirmedOrders,
        fulfilledOrders,
        cancelledOrders,
        refundedOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
      };
    }, 'Fetching order statistics');
  }

  private async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const dateString = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Get the count of orders created today
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const todayEnd = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1,
    );

    const count = await this.prisma.order.count({
      where: {
        createdAt: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
    });

    const orderNumber = `ORD-${dateString}-${String(count + 1).padStart(4, '0')}`;
    return orderNumber;
  }

  private async validateOrderItems(items: CreateOrderItemDto[]): Promise<void> {
    if (!items || items.length === 0) {
      throw new BadRequestException('Order must have at least one item');
    }

    for (const item of items) {
      if (!item.productId && !item.courseId) {
        throw new BadRequestException(
          'Each order item must have either a product or course',
        );
      }

      if (item.productId && item.courseId) {
        throw new BadRequestException(
          'Order item cannot have both product and course',
        );
      }

      if (item.productId) {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
        });
        this.errorHandler.throwIfNotFoundById(
          'Product',
          item.productId,
          product,
        );
      }

      if (item.courseId) {
        const course = await this.prisma.course.findUnique({
          where: { id: item.courseId },
        });
        this.errorHandler.throwIfNotFoundById('Course', item.courseId, course);
      }
    }
  }

  private validateStatusTransition(
    currentStatus: string,
    newStatus: string,
  ): void {
    // Validate that both statuses are valid enum values
    if (!isValidOrderStatus(currentStatus)) {
      throw new BadRequestException(`Invalid current status: ${currentStatus}`);
    }

    if (!isValidOrderStatus(newStatus)) {
      throw new BadRequestException(`Invalid new status: ${newStatus}`);
    }

    // Validate the transition
    // if (!isValidStatusTransition(currentStatus, newStatus)) {
    //   throw new BadRequestException(
    //     `Invalid status transition from ${currentStatus} to ${newStatus}`,
    //   );
    // }
  }

  async getPaymentDetails(id: string): Promise<any> {
    return this.errorHandler.safeExecute(async () => {
      const order = await this.prisma.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: true,
              course: true,
            },
          },
          payments: {
            include: {
              paymentMethod: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      this.errorHandler.throwIfNotFoundById('Order', id, order);

      // Get payment details
      const payment = order.payments[0];
      const gatewayResponse = payment?.gatewayResponse as any;

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalAmount: Number(order.totalAmount),
        currency: order.currency,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethodCode: payment?.paymentMethod?.code || 'QRIS',
        qrString: gatewayResponse?.qr_string || '',
        expiryDate: gatewayResponse?.expires_at || new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
        items: order.items.map((item) => ({
          id: item.id,
          productName: item.product?.name || item.course?.title || 'Unknown Product',
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })),
      };
    }, 'Fetching order payment details');
  }
}
