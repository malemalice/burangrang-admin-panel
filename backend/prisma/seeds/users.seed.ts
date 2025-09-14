import { PrismaClient, Role, Office } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export const users = [
  {
    email: 'admin@example.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    isActive: true,
    roleName: 'Super Admin',
  },
];

export async function seedUsers(
  prisma: PrismaClient,
  roles: Role[],
  offices: Office[]
) {
  console.log('Creating admin user...');
  const createdUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const role = roles.find((r) => r.name === user.roleName);
      const office = offices[0]; // Using first office as default

      if (!role) {
        throw new Error(`Role ${user.roleName} not found`);
      }

      return prisma.user.create({
        data: {
          email: user.email,
          password: hashedPassword,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive,
          roleId: role.id,
          officeId: office.id,
        },
      });
    })
  );
  console.log('Created users:', createdUsers.map((u) => u.email));
  return createdUsers;
} 