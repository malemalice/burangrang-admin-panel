import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedPaymentMethods() {
  console.log('🌱 Seeding payment methods...');

  const paymentMethods = [
    {
      name: 'Credit Card',
      code: 'CREDIT_CARD',
      description: 'Credit card payments via Stripe',
      isActive: true,
    },
    {
      name: 'PayPal',
      code: 'PAYPAL',
      description: 'PayPal payment gateway',
      isActive: true,
    },
    {
      name: 'Bank Transfer',
      code: 'BANK_TRANSFER',
      description: 'Direct bank transfer',
      isActive: true,
    },
    {
      name: 'Cash on Delivery',
      code: 'COD',
      description: 'Cash on delivery for physical products',
      isActive: false,
    },
    {
      name: 'Cryptocurrency',
      code: 'CRYPTO',
      description: 'Bitcoin and other cryptocurrencies',
      isActive: false,
    },
  ];

  for (const paymentMethodData of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: { code: paymentMethodData.code },
      update: paymentMethodData,
      create: paymentMethodData,
    });
  }

  console.log(`✅ Seeded ${paymentMethods.length} payment methods`);
}

export default seedPaymentMethods;
