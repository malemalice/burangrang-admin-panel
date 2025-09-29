import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedOrders() {
  console.log('🌱 Seeding orders...');

  // Get customers, products, courses, and payment methods
  const customers = await prisma.customer.findMany({
    take: 3,
    include: { user: true },
  });

  const products = await prisma.product.findMany({
    take: 5,
  });

  const courses = await prisma.course.findMany({
    take: 3,
  });

  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { isActive: true },
  });

  if (customers.length === 0) {
    console.log('⚠️  No customers found. Please seed customers first.');
    return;
  }

  if (products.length === 0) {
    console.log('⚠️  No products found. Please seed products first.');
    return;
  }

  if (paymentMethods.length === 0) {
    console.log('⚠️  No payment methods found. Please seed payment methods first.');
    return;
  }

  // Create orders dynamically based on available customers
  const orderStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  const paymentStatuses = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];
  
  // Define the order type
  interface OrderData {
    orderNumber: string;
    customerId: string;
    status: string;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    currency: string;
    paymentStatus: string;
    shippingAddress: string;
    billingAddress: string;
    notes: string;
    orderDate: Date;
    items: Array<{
      productId?: string;
      courseId?: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
  }
  
  // Create 3 sample orders for each customer
  const orders: OrderData[] = [];
  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    
    // Create 3 orders per customer
    for (let j = 0; j < 3; j++) {
      const orderIndex = i * 3 + j;
      const orderNumber = `ORD-20241201-${String(orderIndex + 1).padStart(4, '0')}`;
      const status = orderStatuses[orderIndex % orderStatuses.length];
      const paymentStatus = paymentStatuses[orderIndex % paymentStatuses.length];
      const subtotal = 99.99 + (orderIndex * 50);
      const taxAmount = subtotal * 0.08;
      const discountAmount = orderIndex > 0 ? subtotal * 0.1 : 0;
      const totalAmount = subtotal + taxAmount - discountAmount;
      
      orders.push({
        orderNumber,
        customerId: customer.id,
        status,
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        currency: 'USD',
        paymentStatus,
        shippingAddress: customer.address || `${123 + orderIndex * 100} Main Street, ${customer.city || 'New York'}, ${customer.state || 'NY'} ${customer.postalCode || '10001'}`,
        billingAddress: customer.address || `${123 + orderIndex * 100} Main Street, ${customer.city || 'New York'}, ${customer.state || 'NY'} ${customer.postalCode || '10001'}`,
        notes: `Order ${orderIndex + 1} from ${customer.user.firstName} ${customer.user.lastName}`,
        orderDate: new Date(2024, 10, 15 + orderIndex), // November 15 + orderIndex days
        items: [
          {
            productId: products[orderIndex % products.length]?.id,
            quantity: 1,
            unitPrice: subtotal,
            totalPrice: subtotal,
          },
        ],
      });
    }
  }

  for (const orderData of orders) {
    const { items, ...orderInfo } = orderData;
    
    const order = await prisma.order.create({
      data: {
        ...orderInfo,
        items: {
          create: items,
        },
      },
    });

    // Create a payment for paid orders
    if (orderInfo.paymentStatus === 'PAID') {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          paymentMethodId: paymentMethods[0].id, // Use first payment method
          transactionId: `TXN-${order.orderNumber}-${Date.now()}`,
          amount: orderInfo.totalAmount,
          currency: orderInfo.currency,
          status: 'COMPLETED',
          processedAt: new Date(),
        },
      });
    }

    // Create enrollment for course orders
    for (const item of items) {
      if (item.courseId) {
        await prisma.enrollment.create({
          data: {
            userId: customers.find(c => c.id === orderInfo.customerId)?.userId || '',
            courseId: item.courseId,
            orderId: order.id,
            status: orderInfo.status === 'DELIVERED' ? 'ACTIVE' : 'PENDING',
            enrolledAt: orderInfo.status === 'DELIVERED' ? new Date() : undefined,
          },
        });
      }
    }
  }

  console.log(`✅ Seeded ${orders.length} orders with items, payments, and enrollments`);
}

export default seedOrders;
