import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create default admin role if it doesn't exist
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
      description: 'Administrator role with full access',
      isActive: true,
    },
  });

  // Create default office if it doesn't exist
  const defaultOffice = await prisma.office.upsert({
    where: { code: 'HQ' },
    update: {},
    create: {
      name: 'Headquarters',
      code: 'HQ',
      isActive: true,
    },
  });

  // Create admin user if it doesn't exist
  const hashedPassword = await bcrypt.hash('admin', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
      roleId: adminRole.id,
      officeId: defaultOffice.id,
    },
  });

  console.log('Seed completed successfully');
  console.log('Admin user created:', adminUser);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 