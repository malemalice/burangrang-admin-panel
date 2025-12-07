/**
 * Menu seed data
 * Following TRD.md patterns for seed data
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const seedMenus = async () => {
  console.log('🌱 Seeding menus...');

  try {
    // Get roles for menu assignment
    const superAdminRole = await prisma.role.findFirst({
      where: { name: 'Super Admin' },
    });

    const adminRole = await prisma.role.findFirst({
      where: { name: 'Administrator' },
    });

    const managerRole = await prisma.role.findFirst({
      where: { name: 'Manager' },
    });

    const userRole = await prisma.role.findFirst({
      where: { name: 'User' },
    });

    if (!superAdminRole || !adminRole || !managerRole || !userRole) {
      console.log('⚠️  Required roles not found. Please run role seeds first.');
      return;
    }

    // Clear existing menus
    await prisma.menu.deleteMany({});

    // Create top-level menus
    await prisma.menu.create({
      data: {
        name: 'Dashboard',
        path: '/',
        icon: 'LayoutDashboard',
        order: 1,
        isActive: true,
        roles: {
          connect: [
            { id: superAdminRole.id },
            { id: adminRole.id },
            { id: managerRole.id },
            { id: userRole.id },
          ],
        },
      },
    });

    const OrdersMenu = await prisma.menu.create({
      data: {
        name: 'Orders',
        path: '/orders',
        icon: 'ShoppingCart',
        order: 2,
        isActive: true,
        roles: {
          connect: [
            { id: superAdminRole.id },
            { id: adminRole.id },
            { id: managerRole.id },
            { id: userRole.id },
          ],
        },
      },
    });

    const CustomersMenu = await prisma.menu.create({
      data: {
        name: 'Customers',
        path: '/customers',
        icon: 'Users',
        order: 4,
        isActive: true,
        roles: {
          connect: [
            { id: superAdminRole.id },
            { id: adminRole.id },
            { id: managerRole.id },
            { id: userRole.id },
          ],
        },
      },
    });

    const productsMenu = await prisma.menu.create({
      data: {
        name: 'Products',
        path: '#',
        icon: 'Package',
        order: 3,
        isActive: true,
        roles: {
          connect: [
            { id: superAdminRole.id },
            { id: adminRole.id },
            { id: managerRole.id },
            { id: userRole.id },
          ],
        },
      },
    });

    const productMenu = await prisma.menu.create({
      data: {
        name: 'Products',
        path: '/products',
        icon: 'Package',
        order: 1,
        parentId: productsMenu.id,
        isActive: true,
        roles: {
          connect: [
            { id: superAdminRole.id },
            { id: adminRole.id },
            { id: managerRole.id },
          ],
        },
      },
    });

    const coursesMenu = await prisma.menu.create({
      data: {
        name: 'Courses',
        path: '/courses',
        icon: 'BookOpen',
        order: 1,
        parentId: productsMenu.id,
        isActive: true,
        roles: {
          connect: [
            { id: superAdminRole.id },
            { id: adminRole.id },
            { id: managerRole.id },
          ],
        },
      },
    });

    const categoriesMenu = await prisma.menu.create({
      data: {
        name: 'Categories',
        path: '/categories',
        icon: 'Tags',
        parentId: productsMenu.id,
        order: 2,
        isActive: true,
        roles: {
          connect: [
            { id: superAdminRole.id },
            { id: adminRole.id },
            { id: managerRole.id },
          ],
        },
      },
    });

    const productTypesMenu = await prisma.menu.create({
      data: {
        name: 'Product Types',
        path: '/product-types',
        icon: 'Type',
        parentId: productsMenu.id,
        order: 3,
        isActive: true,
        roles: {
          connect: [
            { id: superAdminRole.id },
            { id: adminRole.id },
            { id: managerRole.id },
          ],
        },
      },
    });

    const masterDataMenu = await prisma.menu.create({
      data: {
        name: 'Master Data',
        icon: 'Database',
        order: 98,
        isActive: true,
        roles: {
          connect: [
            { id: superAdminRole.id },
            { id: adminRole.id },
            { id: managerRole.id },
          ],
        },
      },
    });

    const settingsMenu = await prisma.menu.create({
      data: {
        name: 'Settings',
        path: '/settings',
        icon: 'Settings',
        order: 99,
        isActive: true,
        roles: {
          connect: [{ id: superAdminRole.id }, { id: adminRole.id }],
        },
      },
    });

    // Settings submenus (align with frontend routes)
    await prisma.menu.create({
      data: {
        name: 'Management',
        path: '/settings/management',
        icon: 'SlidersHorizontal',
        parentId: settingsMenu.id,
        order: 1,
        isActive: true,
        roles: {
          connect: [{ id: superAdminRole.id }, { id: adminRole.id }],
        },
      },
    });

    await prisma.menu.create({
      data: {
        name: 'Settings',
        path: '/settings',
        icon: 'SlidersHorizontal',
        parentId: settingsMenu.id,
        order: 1,
        isActive: true,
        roles: {
          connect: [{ id: superAdminRole.id }, { id: adminRole.id }],
        },
      },
    });

    // Notifications (top-level, align with frontend routes)
    await prisma.menu.create({
      data: {
        name: 'Notifications',
        path: '/notifications',
        icon: 'Bell',
        order: 5,
        isActive: true,
        roles: {
          connect: [{ id: superAdminRole.id }, { id: adminRole.id }],
        },
      },
    });

    // Mail Templates (top-level, align with frontend routes)
    await prisma.menu.create({
      data: {
        name: 'Email Templates',
        path: '/mail-templates',
        icon: 'Mail',
        order: 6,
        isActive: true,
        parentId: settingsMenu.id,
        roles: {
          connect: [{ id: superAdminRole.id }, { id: adminRole.id }],
        },
      },
    });

    // Create Master Data submenus
    await prisma.menu.create({
      data: {
        name: 'Offices',
        path: '/master/offices',
        icon: 'Building',
        parentId: masterDataMenu.id,
        order: 1,
        isActive: true,
        roles: {
          connect: [
            { id: superAdminRole.id },
            { id: adminRole.id },
            { id: managerRole.id },
          ],
        },
      },
    });

    await prisma.menu.create({
      data: {
        name: 'Departments',
        path: '/master/departments',
        icon: 'Building2',
        parentId: masterDataMenu.id,
        order: 2,
        isActive: true,
        roles: {
          connect: [
            { id: superAdminRole.id },
            { id: adminRole.id },
            { id: managerRole.id },
          ],
        },
      },
    });

    await prisma.menu.create({
      data: {
        name: 'Job Positions',
        path: '/master/job-positions',
        icon: 'Briefcase',
        parentId: masterDataMenu.id,
        order: 3,
        isActive: true,
        roles: {
          connect: [
            { id: superAdminRole.id },
            { id: adminRole.id },
            { id: managerRole.id },
          ],
        },
      },
    });

    await prisma.menu.create({
      data: {
        name: 'Approvals',
        path: '/master/approvals',
        icon: 'ShieldCheck',
        parentId: masterDataMenu.id,
        order: 4,
        isActive: true,
        roles: {
          connect: [{ id: superAdminRole.id }, { id: adminRole.id }],
        },
      },
    });

    // Create User Management submenus
    await prisma.menu.create({
      data: {
        name: 'Users',
        path: '/users',
        icon: 'Users',
        parentId: masterDataMenu.id,
        order: 1,
        isActive: true,
        roles: {
          connect: [{ id: superAdminRole.id }, { id: adminRole.id }],
        },
      },
    });

    await prisma.menu.create({
      data: {
        name: 'Roles',
        path: '/roles',
        icon: 'Shield',
        parentId: masterDataMenu.id,
        order: 2,
        isActive: true,
        roles: {
          connect: [{ id: superAdminRole.id }, { id: adminRole.id }],
        },
      },
    });

    await prisma.menu.create({
      data: {
        name: 'Menus',
        path: '/menus',
        icon: 'Menu',
        parentId: masterDataMenu.id,
        order: 3,
        isActive: true,
        roles: {
          connect: [{ id: superAdminRole.id }, { id: adminRole.id }],
        },
      },
    });

    // Note: Excluding experimental menus without frontend routes:
    // - /users/reports
    // - /users/activity
    // - /users/activity/logs

    console.log('✅ Menus seeded successfully');
    console.log(`   - Total menu items: ${await prisma.menu.count()}`);
  } catch (error) {
    console.error('❌ Error seeding menus:', error);
    throw error;
  }
};

export default seedMenus;
