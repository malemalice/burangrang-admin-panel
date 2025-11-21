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
import { seedRiskMatrix } from './seeds/risk-matrix.seed';
import { seedSettings } from './seeds/settings.seed';
import { seedMenus } from './seeds/menus.seed';
import { seedNotifications } from './seeds/notification-types.seed';
import { seedFileCategories } from './seeds/file-categories.seed';
import { seedFileStorageProviders } from './seeds/file-storage-providers.seed';
import { seedPPE } from './seeds/ppe.seed';
import { seedSafetyEquipmentTypes } from './seeds/safety-equipment-types.seed';
import { seedSafetyEquipments } from './seeds/safety-equipments.seed';

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
      await prisma.notificationRecipient.deleteMany();
      await prisma.notification.deleteMany();
      await prisma.notificationType.deleteMany();
      await prisma.refreshToken.deleteMany();
      // Clear PPE data first (before User deletion due to foreign keys)
      await (prisma as any).pPEWithdrawalItem.deleteMany();
      await (prisma as any).pPEWithdrawal.deleteMany();
      await (prisma as any).pPEStockAdjustment.deleteMany();
      await (prisma as any).pPEExpiryAlert.deleteMany();
      await (prisma as any).pPEStockItem.deleteMany();
      await (prisma as any).pPEStock.deleteMany();
      // Clear Safety Equipment data
      await (prisma as any).safetyEquipment.deleteMany();
      await (prisma as any).safetyEquipmentType.deleteMany();
      // Clear other data
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
      await prisma.threatMitigation.deleteMany();
      await prisma.threat.deleteMany();
      await prisma.hseCategory.deleteMany();
      await prisma.riskMatrix.deleteMany();
      await prisma.setting.deleteMany();
      await prisma.fileAccessLog.deleteMany();
      await prisma.fileUpload.deleteMany();
      await prisma.fileCategory.deleteMany();
      await prisma.fileStorageProvider.deleteMany();
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
        case 'risk_matrix':
          await prisma.riskMatrix.deleteMany();
          break;
        case 'settings':
          await prisma.setting.deleteMany();
          break;
        case 'menus':
          await prisma.menu.deleteMany();
          break;
        case 'notifications':
          await prisma.notificationRecipient.deleteMany();
          await prisma.notification.deleteMany();
          await prisma.notificationType.deleteMany();
          break;

        case 'file_categories':
          await prisma.fileCategory.deleteMany();
          break;
        case 'file_storage_providers':
          await prisma.fileStorageProvider.deleteMany();
          break;
        case 'file_uploads':
          await prisma.fileAccessLog.deleteMany();
          await prisma.fileUpload.deleteMany();
          break;
        case 'safety_equipment_types':
          await (prisma as any).safetyEquipmentType.deleteMany();
          break;
        case 'safety_equipments':
          await (prisma as any).safetyEquipment.deleteMany();
          break;
        case 'ppe':
          await (prisma as any).pPEWithdrawalItem.deleteMany();
          await (prisma as any).pPEWithdrawal.deleteMany();
          await (prisma as any).pPEStockAdjustment.deleteMany();
          await (prisma as any).pPEExpiryAlert.deleteMany();
          await (prisma as any).pPEStockItem.deleteMany();
          await (prisma as any).pPEStock.deleteMany();
          break;
        default:
          console.error(`Unknown table: ${tableToSeed}`);
          console.log('Available tables: users, roles, permissions, offices, departments, job_positions, settings, menus, notifications, categories, product_types, courses, chapters, file_categories, file_storage_providers, file_uploads, safety_equipment_types, safety_equipments, ppe');
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

      // Seed Risk Matrix
      await seedRiskMatrix(prisma);

      await seedSettings(prisma);
      await seedMenus();
      await seedNotifications();
      await seedFileStorageProviders();
      await seedFileCategories();
      await seedSafetyEquipmentTypes();
      await seedSafetyEquipments();
      await seedPPE();
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
        case 'risk_matrix':
          await seedRiskMatrix(prisma);
        case 'settings':
          await seedSettings(prisma);
          break;
        case 'menus':
          const permsForMenus = await seedPermissions(prisma);
          const rolesForMenus = await seedRoles(prisma, permsForMenus);
          await seedMenus();
          break;
        case 'notifications':
          await seedNotifications();
          break;
        case 'file_categories':
          await seedFileCategories();
          break;
        case 'file_storage_providers':
          await seedFileStorageProviders();
          break;
        case 'file_uploads':
          // Note: file uploads are created through the API, not seeded
          console.log('File uploads are created through the API, not seeded');
          break;
        case 'safety_equipment_types':
          await seedSafetyEquipmentTypes();
          break;
        case 'safety_equipments':
          await seedSafetyEquipments();
          break;
        case 'ppe':
          await seedPPE();
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