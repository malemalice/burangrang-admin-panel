import { PrismaClient } from '@prisma/client';
import { seedPermissions } from './seeds/permissions.seed';
import { seedRoles } from './seeds/roles.seed';
import { seedOffices } from './seeds/offices.seed';
import { seedUsers } from './seeds/users.seed';
import { seedDepartments } from './seeds/departments.seed';
import { seedJobPositions } from './seeds/jobpositions.seed';
import { seedHseCategories } from './seeds/hse-categories.seed';
import { seedThreats } from './seeds/threats.seed';
import { seedThreatMitigations } from './seeds/threat-mitigations.seed';

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
      await prisma.user.deleteMany();
      await prisma.role.deleteMany();
      await prisma.permission.deleteMany();
      await prisma.office.deleteMany();
      await prisma.department.deleteMany();
      await prisma.jobPosition.deleteMany();
      await prisma.threatMitigation.deleteMany();
      await prisma.threat.deleteMany();
      await prisma.hseCategory.deleteMany();
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
        case 'hse_categories':
          await prisma.threatMitigation.deleteMany();
          await prisma.threat.deleteMany();
          await prisma.hseCategory.deleteMany();
          break;
        case 'threats':
          await prisma.threatMitigation.deleteMany();
          await prisma.threat.deleteMany();
          break;
        case 'threat_mitigations':
          await prisma.threatMitigation.deleteMany();
          break;
        default:
          console.error(`Unknown table: ${tableToSeed}`);
          console.log('Available tables: users, roles, permissions, offices, departments, jobpositions, hse_categories, threats, threat_mitigations');
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
      
      // Seed HSE-related data
      const hseCategories = await seedHseCategories(prisma);
      const threats = await seedThreats(prisma, hseCategories.map(c => c.id));
      await seedThreatMitigations(prisma, threats.map(t => t.id));
      
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
        case 'hse_categories':
          await seedHseCategories(prisma);
          break;
        case 'threats':
          // Find existing categories or create new ones if they don't exist
          let categories;
          try {
            categories = await prisma.hseCategory.findMany();
            if (categories.length === 0) {
              categories = await seedHseCategories(prisma);
            } else {
              console.log('Using existing HSE categories...');
            }
          } catch (error) {
            console.log('Error finding categories, creating new ones...');
            categories = await seedHseCategories(prisma);
          }
          await seedThreats(prisma, categories.map(c => c.id));
          break;
        case 'threat_mitigations':
          // Find existing threats or create new ones if they don't exist
          let cats, thrs;
          try {
            cats = await prisma.hseCategory.findMany();
            if (cats.length === 0) {
              cats = await seedHseCategories(prisma);
            } else {
              console.log('Using existing HSE categories...');
            }
            
            thrs = await prisma.threat.findMany();
            if (thrs.length === 0) {
              thrs = await seedThreats(prisma, cats.map(c => c.id));
            } else {
              console.log('Using existing threats...');
            }
          } catch (error) {
            console.log('Error finding categories or threats, creating new ones...');
            cats = await seedHseCategories(prisma);
            thrs = await seedThreats(prisma, cats.map(c => c.id));
          }
          await seedThreatMitigations(prisma, thrs.map(t => t.id));
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