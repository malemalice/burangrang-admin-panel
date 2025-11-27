import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { XenditService } from '../../shared/services/xendit.service';
import { CheckoutRequestDto } from './dto/checkout-request.dto';
import { CheckoutResponseDto } from './dto/checkout-response.dto';
import { Decimal } from '@prisma/client/runtime/library';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly xenditService: XenditService,
  ) {}

  /**
   * Generate a random secure password for guest users
   */
  private generateRandomPassword(): string {
    const length = 16;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);

    for (let i = 0; i < length; i++) {
      password += charset[randomValues[i] % charset.length];
    }

    return password;
  }

  /**
   * Main checkout flow
   * Handles guest user creation, order creation, payment, and Xendit QRIS QR Code
   */
  async checkout(checkoutData: CheckoutRequestDto): Promise<CheckoutResponseDto> {
    return this.errorHandler.safeExecute(async () => {
      this.logger.log(`Starting checkout for email: ${checkoutData.email}`);

      // Step 1: Resolve or create user and customer
      const { customer } = await this.resolveUserAndCustomer(checkoutData);

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

      // Step 7: Create Xendit QRIS QR Code
      const qrCode = await this.createXenditQRCode(order, totals.total);

      // Step 8: Update payment with Xendit QR Code response
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          gatewayResponse: qrCode as any,
        },
      });

      this.logger.log(
        `Checkout completed successfully for order: ${order.orderNumber} with QRIS`,
      );

      // Return checkout response
      return new CheckoutResponseDto({
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentId: payment.id,
        transactionId: payment.transactionId,
        paymentMethodCode: paymentMethod.code,
        qrCodeId: qrCode.id,
        qrString: qrCode.qr_string,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: Number(order.totalAmount),
        currency: order.currency,
        expiryDate: qrCode.expires_at,
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

      // Generate random password for guest user
      const randomPassword = this.generateRandomPassword();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      // Create new user (guest - with random password)
      user = await this.prisma.user.create({
        data: {
          email: checkoutData.email,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          password: hashedPassword,
          firstName: checkoutData.firstName,
          lastName: checkoutData.lastName,
          roleId: userRole.id,
          officeId: hqOffice.id,
          isActive: true,
        },
        include: { customerProfile: true },
      });

      this.logger.log(`Guest user created: ${user.id} with random password`);
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

      // Determine unit price
      let unitPrice: number;

      // Check if product allows free pricing and custom price is provided
      if (product.isFreePrice && item.price !== undefined && item.price !== null) {
        // Validate custom price against constraints
        const minPrice = Number(product.minFreePrice || 1000);
        const customPrice = Number(item.price);

        if (customPrice < minPrice) {
          throw new BadRequestException(
            `Custom price must be at least ${minPrice} for product ${product.name}`,
          );
        }

        if (product.maxFreePrice !== null) {
          const maxPrice = Number(product.maxFreePrice);
          if (customPrice > maxPrice) {
            throw new BadRequestException(
              `Custom price cannot exceed ${maxPrice} for product ${product.name}`,
            );
          }
        }

        // Use custom price
        unitPrice = customPrice;
        this.logger.log(
          `Using custom price ${unitPrice} for product ${product.name} (isFreePrice: true)`,
        );
      } else {
        // Use regular product price (salePrice if available, otherwise regular price)
        const actualPrice = product.salePrice || product.price;
        unitPrice = Number(actualPrice);
        this.logger.log(
          `Using regular price ${unitPrice} for product ${product.name}`,
        );
      }

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
   * Step 7: Create Xendit QRIS QR Code
   */
  private async createXenditQRCode(order: any, totalAmount: number) {
    // Calculate expiry date (5 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 5);

    // Round up amount for IDR (no decimals allowed)
    const roundedAmount = Math.ceil(totalAmount);

    this.logger.log(
      `Original amount: ${totalAmount}, Rounded amount: ${roundedAmount}`,
    );

    const qrCode = await this.xenditService.createQRCode({
      reference_id: order.orderNumber,
      type: 'DYNAMIC',
      currency: 'IDR',
      amount: roundedAmount,
      expires_at: expiresAt.toISOString(),
      metadata: {
        orderId: order.id,
      },
    });

    this.logger.log(`Xendit QR Code created: ${qrCode.id}`);

    return qrCode;
  }
}
