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
  {
    email: 'hse.lead.academic@mailinator.com',
    password: 'admin123',
    firstName: 'HSE',
    lastName: 'Lead Academic',
    isActive: true,
    roleName: 'User',
    departmentName: 'Academics',
    jobPositionName: 'Lead',
  },
  {
    email: 'hse.head.administration@mailinator.com',
    password: 'admin123',
    firstName: 'HSE',
    lastName: 'Head Administration',
    isActive: true,
    roleName: 'User',
    departmentName: 'Administration',
    jobPositionName: 'Head',
  },
  {
    email: 'technician1@mailinator.com',
    password: 'admin123',
    firstName: 'Technician',
    lastName: '1',
    isActive: true,
    roleName: 'Technician',
    departmentName: 'Technician',
    jobPositionName: 'Technician',
  },
  {
    email: 'technician2@mailinator.com',
    password: 'admin123',
    firstName: 'Technician',
    lastName: '2',
    isActive: true,
    roleName: 'Technician',
    departmentName: 'Technician',
    jobPositionName: 'Technician',
  },
  {
    email: 'technician3@mailinator.com',
    password: 'admin123',
    firstName: 'Technician',
    lastName: '3',
    isActive: true,
    roleName: 'Technician',
    departmentName: 'Technician',
    jobPositionName: 'Technician',
  },
  {
    email: 'hse.head.hse@mailinator.com',
    password: 'admin123',
    firstName: 'HSE',
    lastName: 'Head',
    isActive: true,
    roleName: 'User',
    departmentName: 'HSE',
    jobPositionName: 'Head',
  },
  {
    email: 'hse.staff.hse@mailinator.com',
    password: 'admin123',
    firstName: 'HSE',
    lastName: 'Staff',
    isActive: true,
    roleName: 'User',
    departmentName: 'HSE',
    jobPositionName: 'Staff',
  },
  {
    email: 'embed-viewer@system',
    password: 'embed-viewer-system-no-login-xK9mP2vL7nQ4wR8tY1zA5bC6dE0fG3hJ',
    firstName: 'Embed',
    lastName: 'Viewer',
    isActive: true,
    roleName: 'Embed Viewer',
  },
];

export async function seedUsers(
  prisma: PrismaClient,
  roles: Role[],
  offices: Office[]
) {
  console.log('Creating users...');
  
  // Fetch departments and job positions from database
  const departments = await prisma.department.findMany();
  const jobPositions = await prisma.jobPosition.findMany();
  
  const createdUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const role = roles.find((r) => r.name === user.roleName);
      const office = offices[0]; // Using first office as default

      if (!role) {
        throw new Error(`Role ${user.roleName} not found`);
      }

      // Find department if specified
      const department = user.departmentName
        ? departments.find((d) => d.name === user.departmentName)
        : null;

      // Find job position if specified
      const jobPosition = user.jobPositionName
        ? jobPositions.find((jp) => jp.name === user.jobPositionName)
        : null;

      if (user.departmentName && !department) {
        throw new Error(`Department ${user.departmentName} not found`);
      }

      if (user.jobPositionName && !jobPosition) {
        throw new Error(`Job Position ${user.jobPositionName} not found`);
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
          departmentId: department?.id,
          jobPositionId: jobPosition?.id,
        },
      });
    })
  );
  console.log('Created users:', createdUsers.map((u) => u.email));
  return createdUsers;
} 