import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedPaymentMethods() {
  console.log('🌱 Seeding payment methods...');

  const paymentMethods = [
    // Xendit Payment Methods - Indonesia
    {
      name: 'Credit Card',
      code: 'CREDIT_CARD',
      description: 'Credit card payments (Visa, Mastercard, JCB, American Express) via Xendit',
      isActive: true,
    },
    {
      name: 'QRIS',
      code: 'QRIS',
      description: 'Universal QR payment accepted everywhere in Indonesia',
      isActive: true,
    },
    {
      name: 'OVO',
      code: 'OVO',
      description: 'OVO e-wallet payment',
      isActive: true,
    },
    {
      name: 'DANA',
      code: 'DANA',
      description: 'DANA e-wallet payment',
      isActive: true,
    },
    {
      name: 'ShopeePay',
      code: 'SHOPEEPAY',
      description: 'ShopeePay e-wallet payment',
      isActive: true,
    },
    {
      name: 'LinkAja',
      code: 'LINKAJA',
      description: 'LinkAja e-wallet payment',
      isActive: true,
    },
    {
      name: 'BCA Virtual Account',
      code: 'BCA',
      description: 'BCA Virtual Account (Rp 4,000 fee)',
      isActive: true,
    },
    {
      name: 'BNI Virtual Account',
      code: 'BNI',
      description: 'BNI Virtual Account (Rp 4,000 fee)',
      isActive: true,
    },
    {
      name: 'BRI Virtual Account',
      code: 'BRI',
      description: 'BRI Virtual Account (Rp 4,000 fee)',
      isActive: true,
    },
    {
      name: 'Mandiri Virtual Account',
      code: 'MANDIRI',
      description: 'Mandiri Virtual Account (Rp 4,000 fee)',
      isActive: true,
    },
    {
      name: 'Permata Virtual Account',
      code: 'PERMATA',
      description: 'Permata Virtual Account (Rp 4,000 fee)',
      isActive: true,
    },
    {
      name: 'Alfamart',
      code: 'ALFAMART',
      description: 'Pay at Alfamart stores (Rp 5,000 fee)',
      isActive: true,
    },
    {
      name: 'Indomaret',
      code: 'INDOMARET',
      description: 'Pay at Indomaret stores (Rp 5,000 fee)',
      isActive: true,
    },
    // Legacy payment methods (kept for backward compatibility)
    {
      name: 'PayPal',
      code: 'PAYPAL',
      description: 'PayPal payment gateway',
      isActive: false,
    },
    {
      name: 'Bank Transfer',
      code: 'BANK_TRANSFER',
      description: 'Direct bank transfer',
      isActive: false,
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
