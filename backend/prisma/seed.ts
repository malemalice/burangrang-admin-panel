import { PrismaClient } from '@prisma/client';
import { seedPermissions } from './seeds/permissions.seed';
import { seedRoles } from './seeds/roles.seed';
import { seedOffices } from './seeds/offices.seed';
import { seedUsers } from './seeds/users.seed';
import { seedDepartments } from './seeds/departments.seed';
import { seedJobPositions } from './seeds/jobpositions.seed';
import { seedSettings } from './seeds/settings.seed';
import { seedMenus } from './seeds/menus.seed';
import { seedNotifications } from './seeds/notification-types.seed';
import { seedCategories } from './seeds/categories.seed';
import { seedProductTypes } from './seeds/product-types.seed';
import { seedCourses } from './seeds/courses.seed';
import { seedChapters } from './seeds/chapters.seed';
import { seedFileCategories } from './seeds/file-categories.seed';
import { seedFileStorageProviders } from './seeds/file-storage-providers.seed';
import { seedProducts } from './seeds/products.seed';

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
      await prisma.chapter.deleteMany();
      await prisma.course.deleteMany();
      await prisma.productDownload.deleteMany();
      await prisma.productFile.deleteMany();
      await prisma.productCategory.deleteMany();
      await prisma.product.deleteMany();
      await prisma.notificationRecipient.deleteMany();
      await prisma.notification.deleteMany();
      await prisma.notificationType.deleteMany();
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
      await prisma.category.deleteMany();
      await prisma.productType.deleteMany();
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
        case 'categories':
          await prisma.category.deleteMany();
          break;
        case 'product_types':
          await prisma.productType.deleteMany();
          break;
        case 'courses':
          await prisma.chapter.deleteMany();
          await prisma.course.deleteMany();
          break;
        case 'chapters':
          await prisma.chapter.deleteMany();
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
        case 'products':
          await prisma.productDownload.deleteMany();
          await prisma.productFile.deleteMany();
          await prisma.productCategory.deleteMany();
          await prisma.product.deleteMany();
          break;
        default:
          console.error(`Unknown table: ${tableToSeed}`);
          console.log('Available tables: users, roles, permissions, offices, departments, job_positions, settings, menus, notifications, categories, product_types, courses, chapters, file_categories, file_storage_providers, file_uploads, products');
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
      const users = await seedUsers(prisma, roles, offices);
      await seedSettings(prisma);
      await seedMenus();
      await seedNotifications();
      const categories = await seedCategories(prisma);
      await seedProductTypes();
      const courses = await seedCourses(prisma, users, categories);
      await seedChapters(prisma, courses);
      await seedProducts();
      await seedFileStorageProviders();
      await seedFileCategories();
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
        case 'notifications':
          await seedNotifications();
          break;
        case 'categories':
          await seedCategories(prisma);
          break;
        case 'product_types':
          await seedProductTypes();
          break;
        case 'courses':
          const permsForCourses = await seedPermissions(prisma);
          const rolesForCourses = await seedRoles(prisma, permsForCourses);
          const officesForCourses = await seedOffices(prisma);
          const usersForCourses = await seedUsers(prisma, rolesForCourses, officesForCourses);
          const categoriesForCourses = await seedCategories(prisma);
          await seedCourses(prisma, usersForCourses, categoriesForCourses);
          break;
        case 'chapters':
          const permsForChapters = await seedPermissions(prisma);
          const rolesForChapters = await seedRoles(prisma, permsForChapters);
          const officesForChapters = await seedOffices(prisma);
          const usersForChapters = await seedUsers(prisma, rolesForChapters, officesForChapters);
          const categoriesForChapters = await seedCategories(prisma);
          const coursesForChapters = await seedCourses(prisma, usersForChapters, categoriesForChapters);
          await seedChapters(prisma, coursesForChapters);
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
        case 'products':
          const permsForProducts = await seedPermissions(prisma);
          const rolesForProducts = await seedRoles(prisma, permsForProducts);
          const officesForProducts = await seedOffices(prisma);
          const usersForProducts = await seedUsers(prisma, rolesForProducts, officesForProducts);
          const categoriesForProducts = await seedCategories(prisma);
          await seedProductTypes();
          await seedProducts();
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