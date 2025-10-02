import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedCustomers() {
  console.log('🌱 Seeding customers...');

  // Get some users to create customer profiles for
  const users = await prisma.user.findMany({
    take: 5,
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  if (users.length === 0) {
    console.log('⚠️  No users found. Please seed users first.');
    return;
  }

  // Create customer profiles for available users
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];
  const states = ['NY', 'CA', 'IL', 'TX', 'AZ'];
  const postalCodes = ['10001', '90210', '60601', '77001', '85001'];
  
  const customers = users.map((user, index) => ({
    userId: user.id,
    phone: `+123456789${index}`,
    address: `${123 + index * 100} Main Street`,
    city: cities[index] || cities[0],
    state: states[index] || states[0],
    country: 'USA',
    postalCode: postalCodes[index] || postalCodes[0],
    dateOfBirth: new Date(1990 + index, index, 15),
    gender: index % 2 === 0 ? 'Male' : 'Female',
  }));

  for (const customerData of customers) {
    await prisma.customer.upsert({
      where: { userId: customerData.userId },
      update: customerData,
      create: customerData,
    });
  }

  console.log(`✅ Seeded ${customers.length} customers`);
}

export default seedCustomers;
