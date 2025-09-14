import { PrismaClient } from '@prisma/client';
import { seedPermissions } from './seeds/permissions.seed';
import { seedRoles } from './seeds/roles.seed';
import { seedOffices } from './seeds/offices.seed';
import { seedUsers } from './seeds/users.seed';
import { seedDepartments } from './seeds/departments.seed';
import { seedJobPositions } from './seeds/jobpositions.seed';
import { seedSettings } from './seeds/settings.seed';
import { seedMenus } from './seeds/menus.seed';

const prisma = new PrismaClient();

// Get the table name from command line arguments
const tableToSeed = process.argv[2]?.toLowerCase();

async function main() {
  try {
    console.log('Starting seed process...');

    // Clear existing data
    console.log('Clearing existing data...');
    
    // If no specific table is provided, clear all tables
    if (!tableToSeed) {
      // Delete in order to respect foreign key constraints
      await prisma.refreshToken.deleteMany();
      await prisma.masterApprovalItem.deleteMany();
      await prisma.approval.deleteMany();
      await prisma.masterApproval.deleteMany();
      await prisma.user.deleteMany();
      await prisma.menu.deleteMany();
      await prisma.role.deleteMany();
      await prisma.permission.deleteMany();
      await prisma.office.deleteMany();
      await prisma.department.deleteMany();
      await prisma.jobPosition.deleteMany();
      await prisma.setting.deleteMany();
      console.log('All existing data cleared successfully');
    } else {
      // Clear only the specified table
      switch (tableToSeed) {
        case 'users':
          await prisma.user.deleteMany();
          break;
        case 'roles':
          await prisma.role.deleteMany();
          break;
        case 'permissions':
          await prisma.permission.deleteMany();
          break;
        case 'offices':
          await prisma.office.deleteMany();
          break;
        case 'departments':
          await prisma.department.deleteMany();
          break;
        case 'job_positions':
          await prisma.jobPosition.deleteMany();
          break;
        case 'settings':
          await prisma.setting.deleteMany();
          break;
        case 'menus':
          await prisma.menu.deleteMany();
          break;
        default:
          console.error(`Unknown table: ${tableToSeed}`);
          console.log('Available tables: users, roles, permissions, offices, departments, job_positions, settings, menus');
          process.exit(1);
      }
      console.log(`Cleared existing data for table: ${tableToSeed}`);
    }

    // Seed data based on the specified table or all tables
    if (!tableToSeed) {
      // Seed all tables in order of dependencies
      const permissions = await seedPermissions(prisma);
      const roles = await seedRoles(prisma, permissions);
      const offices = await seedOffices(prisma);
      const departments = await seedDepartments(prisma);
      const jobPositions = await seedJobPositions(prisma);
      await seedUsers(prisma, roles, offices);
      await seedSettings(prisma);
      await seedMenus();
      console.log('All tables seeded successfully');
    } else {
      // Seed only the specified table
      switch (tableToSeed) {
        case 'permissions':
          await seedPermissions(prisma);
          break;
        case 'roles':
          const permissions = await seedPermissions(prisma);
          await seedRoles(prisma, permissions);
          break;
        case 'offices':
          await seedOffices(prisma);
          break;
        case 'departments':
          await seedDepartments(prisma);
          break;
        case 'job_positions':
          await seedJobPositions(prisma);
          break;
        case 'users':
          const perms = await seedPermissions(prisma);
          const roles = await seedRoles(prisma, perms);
          const offices = await seedOffices(prisma);
          await seedUsers(prisma, roles, offices);
          break;
        case 'settings':
          await seedSettings(prisma);
          break;
        case 'menus':
          const permsForMenus = await seedPermissions(prisma);
          const rolesForMenus = await seedRoles(prisma, permsForMenus);
          await seedMenus();
          break;
      }
      console.log(`Table ${tableToSeed} seeded successfully`);
    }

    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 