import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { XenditService } from '../../shared/services/xendit.service';
import { ConfigService } from '@nestjs/config';
import { CheckoutRequestDto } from './dto/checkout-request.dto';
import { CheckoutResponseDto } from './dto/checkout-response.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly xenditService: XenditService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Main checkout flow
   * Handles guest user creation, order creation, payment, and Xendit invoice
   */
  async checkout(checkoutData: CheckoutRequestDto): Promise<CheckoutResponseDto> {
    return this.errorHandler.safeExecute(async () => {
      this.logger.log(`Starting checkout for email: ${checkoutData.email}`);

      // Step 1: Resolve or create user and customer
      const { user, customer } = await this.resolveUserAndCustomer(checkoutData);

      // Step 2: Validate cart items
      const validatedItems = await this.validateCartItems(checkoutData.items);

      // Step 3: Calculate order totals
      const totals = this.calculateTotals(validatedItems);

      // Step 4: Validate payment method
      const paymentMethod = await this.validatePaymentMethod(
        checkoutData.paymentMethodCode,
      );

      // Step 5: Create order with items
      const order = await this.createOrder(customer.id, checkoutData, validatedItems, totals);

      // Step 6: Create payment record
      const payment = await this.createPayment(order, paymentMethod, totals.total);

      // Step 7: Create Xendit invoice
      const xenditInvoice = await this.createXenditInvoice(
        order,
        customer,
        user,
        checkoutData,
        validatedItems,
        totals.total,
      );

      // Step 8: Update payment with Xendit response
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          gatewayResponse: xenditInvoice as any,
        },
      });

      this.logger.log(`Checkout completed successfully for order: ${order.orderNumber}`);

      // Return checkout response
      return new CheckoutResponseDto({
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentId: payment.id,
        transactionId: payment.transactionId,
        paymentUrl: xenditInvoice.invoice_url,
        invoiceId: xenditInvoice.id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: Number(order.totalAmount),
        currency: order.currency,
        expiryDate: xenditInvoice.expiry_date,
      });
    }, 'Processing checkout');
  }

  /**
   * Step 1: Resolve or create user and customer profile
   */
  private async resolveUserAndCustomer(checkoutData: CheckoutRequestDto) {
    // Check if user exists by email
    let user = await this.prisma.user.findUnique({
      where: { email: checkoutData.email },
      include: { customerProfile: true },
    });

    // If user doesn't exist, create new guest user
    if (!user) {
      this.logger.log(`Creating new guest user for email: ${checkoutData.email}`);

      // Get USER role
      const userRole = await this.prisma.role.findUnique({
        where: { name: 'User' },
      });

      if (!userRole) {
        throw new BadRequestException('User role not found in system');
      }

      // Get HQ office
      const hqOffice = await this.prisma.office.findUnique({
        where: { code: 'HQ' },
      });

      if (!hqOffice) {
        throw new BadRequestException('HQ office not found in system');
      }

      // Create new user (guest - password is null)
      user = await this.prisma.user.create({
        data: {
          email: checkoutData.email,
          password: null, // Guest user, can set password later
          firstName: checkoutData.firstName,
          lastName: checkoutData.lastName,
          roleId: userRole.id,
          officeId: hqOffice.id,
          isActive: true,
        },
        include: { customerProfile: true },
      });

      this.logger.log(`Guest user created: ${user.id}`);
    }

    // Check if customer profile exists
    let customer = user.customerProfile;

    // If customer profile doesn't exist, create it
    if (!customer) {
      this.logger.log(`Creating customer profile for user: ${user.id}`);

      customer = await this.prisma.customer.create({
        data: {
          userId: user.id,
          phone: checkoutData.phone,
          isActive: true,
        },
      });

      this.logger.log(`Customer profile created: ${customer.id}`);
    } else {
      // Update customer profile if needed
      customer = await this.prisma.customer.update({
        where: { id: customer.id },
        data: {
          phone: checkoutData.phone || customer.phone,
        },
      });
    }

    return { user, customer };
  }

  /**
   * Step 2: Validate cart items and fetch from database
   */
  private async validateCartItems(items: CheckoutRequestDto['items']) {
    const validatedItems: Array<{
      type: string;
      id: string;
      name: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      productId: string;
      courseId: string | null;
    }> = [];

    for (const item of items) {
      // Fetch product from database
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: { course: true },
      });

      if (!product) {
        throw new BadRequestException(`Product not found: ${item.productId}`);
      }

      if (!product.isActive) {
        throw new BadRequestException(`Product is not available: ${product.name}`);
      }

      // Get actual price from database (use salePrice if available, otherwise regular price)
      const actualPrice = product.salePrice || product.price;
      const unitPrice = Number(actualPrice);
      const totalPrice = unitPrice * item.quantity;

      validatedItems.push({
        type: product.productType,
        id: product.id,
        name: product.name,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        productId: product.id,
        courseId: product.course ? product.course.id : null,
      });

      this.logger.log(
        `Validated item: ${product.name} x${item.quantity} @ ${unitPrice} = ${totalPrice}`,
      );
    }

    return validatedItems;
  }

  /**
   * Step 3: Calculate order totals
   */
  private calculateTotals(validatedItems: any[]) {
    const subtotal = validatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = 0; // TODO: Implement tax calculation if needed
    const discountAmount = 0; // TODO: Implement discount/coupon logic
    const total = subtotal + taxAmount - discountAmount;

    return { subtotal, taxAmount, discountAmount, total };
  }

  /**
   * Step 4: Validate payment method
   */
  private async validatePaymentMethod(paymentMethodCode: string) {
    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { code: paymentMethodCode },
    });

    if (!paymentMethod) {
      throw new BadRequestException(`Payment method not found: ${paymentMethodCode}`);
    }

    if (!paymentMethod.isActive) {
      throw new BadRequestException(`Payment method is not active: ${paymentMethod.name}`);
    }

    return paymentMethod;
  }

  /**
   * Step 5: Create order with items
   */
  private async createOrder(
    customerId: string,
    checkoutData: CheckoutRequestDto,
    validatedItems: any[],
    totals: any,
  ) {
    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerId,
        status: 'PENDING',
        subtotal: new Decimal(totals.subtotal),
        taxAmount: new Decimal(totals.taxAmount),
        discountAmount: new Decimal(totals.discountAmount),
        totalAmount: new Decimal(totals.total),
        currency: 'IDR',
        paymentStatus: 'PENDING',
        items: {
          create: validatedItems.map((item) => ({
            productId: item.productId,
            courseId: item.courseId,
            quantity: item.quantity,
            unitPrice: new Decimal(item.unitPrice),
            totalPrice: new Decimal(item.totalPrice),
          })),
        },
      },
      include: {
        items: true,
      },
    });

    this.logger.log(`Order created: ${order.orderNumber}`);

    return order;
  }

  /**
   * Step 6: Create payment record
   */
  private async createPayment(order: any, paymentMethod: any, totalAmount: number) {
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        paymentMethodId: paymentMethod.id,
        transactionId,
        amount: new Decimal(totalAmount),
        currency: 'IDR',
        status: 'PENDING',
      },
    });

    this.logger.log(`Payment created: ${payment.transactionId}`);

    return payment;
  }

  /**
   * Step 7: Create Xendit invoice
   */
  private async createXenditInvoice(
    order: any,
    customer: any,
    user: any,
    checkoutData: CheckoutRequestDto,
    validatedItems: any[],
    totalAmount: number,
  ) {
    const successUrl = this.configService.get<string>('XENDIT_SUCCESS_URL') || 
      'http://localhost:3000/payment/success';
    const failureUrl = this.configService.get<string>('XENDIT_FAILURE_URL') || 
      'http://localhost:3000/payment/failed';

    const xenditInvoice = await this.xenditService.createInvoice({
      external_id: order.orderNumber,
      amount: totalAmount,
      payer_email: user.email,
      description: `Order ${order.orderNumber} - ${validatedItems.length} item(s)`,
      invoice_duration: 86400, // 24 hours
      currency: 'IDR',
      success_redirect_url: successUrl,
      failure_redirect_url: failureUrl,
      customer: {
        given_names: checkoutData.firstName,
        surname: checkoutData.lastName,
        email: user.email,
        mobile_number: checkoutData.phone,
      },
      items: validatedItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.unitPrice,
        category: item.type,
      })),
      metadata: {
        orderId: order.id,
        customerId: customer.id,
        userId: user.id,
      },
    });

    this.logger.log(`Xendit invoice created: ${xenditInvoice.id}`);

    return xenditInvoice;
  }
}

