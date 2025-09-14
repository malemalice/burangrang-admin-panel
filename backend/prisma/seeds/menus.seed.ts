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
    const dashboardMenu = await prisma.menu.create({
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

    const masterDataMenu = await prisma.menu.create({
      data: {
        name: 'Master Data',
        icon: 'Building2',
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

    const userManagementMenu = await prisma.menu.create({
      data: {
        name: 'User Management',
        icon: 'Users',
        order: 3,
        isActive: true,
        roles: {
          connect: [{ id: superAdminRole.id }, { id: adminRole.id }],
        },
      },
    });

    const settingsMenu = await prisma.menu.create({
      data: {
        name: 'Settings',
        path: '/settings',
        icon: 'Settings',
        order: 4,
        isActive: true,
        roles: {
          connect: [{ id: superAdminRole.id }, { id: adminRole.id }],
        },
      },
    });

    // Create Master Data submenus
    const officesMenu = await prisma.menu.create({
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

    const departmentsMenu = await prisma.menu.create({
      data: {
        name: 'Departments',
        path: '/master/departments',
        icon: 'UsersRound',
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

    const jobPositionsMenu = await prisma.menu.create({
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

    const approvalsMenu = await prisma.menu.create({
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
    const usersMenu = await prisma.menu.create({
      data: {
        name: 'Users',
        path: '/users',
        icon: 'Users',
        parentId: userManagementMenu.id,
        order: 1,
        isActive: true,
        roles: {
          connect: [{ id: superAdminRole.id }, { id: adminRole.id }],
        },
      },
    });

    const rolesMenu = await prisma.menu.create({
      data: {
        name: 'Roles',
        path: '/roles',
        icon: 'ShieldCheck',
        parentId: userManagementMenu.id,
        order: 2,
        isActive: true,
        roles: {
          connect: [{ id: superAdminRole.id }, { id: adminRole.id }],
        },
      },
    });

    const menusMenu = await prisma.menu.create({
      data: {
        name: 'Menus',
        path: '/menus',
        icon: 'Menu',
        parentId: userManagementMenu.id,
        order: 3,
        isActive: true,
        roles: {
          connect: [{ id: superAdminRole.id }, { id: adminRole.id }],
        },
      },
    });

    // Create nested submenus for demonstration (3rd level)
    const userReportsMenu = await prisma.menu.create({
      data: {
        name: 'User Reports',
        path: '/users/reports',
        icon: 'BarChart3',
        parentId: userManagementMenu.id,
        order: 1,
        isActive: true,
        roles: {
          connect: [{ id: superAdminRole.id }, { id: adminRole.id }],
        },
      },
    });

    const userActivityMenu = await prisma.menu.create({
      data: {
        name: 'User Activity',
        path: '/users/activity',
        icon: 'Activity',
        parentId: userManagementMenu.id,
        order: 2,
        isActive: true,
        roles: {
          connect: [{ id: superAdminRole.id }, { id: adminRole.id }],
        },
      },
    });

    // Create 4th level menu for demonstration
    const userActivityLogsMenu = await prisma.menu.create({
      data: {
        name: 'Activity Logs',
        path: '/users/activity/logs',
        icon: 'FileText',
        parentId: userActivityMenu.id,
        order: 1,
        isActive: true,
        roles: {
          connect: [{ id: superAdminRole.id }, { id: adminRole.id }],
        },
      },
    });

    console.log('✅ Menus seeded successfully');
    console.log(`   - Created ${await prisma.menu.count()} menu items`);
    console.log(`   - Top-level menus: 4`);
    console.log(`   - Submenus: 6`);
    console.log(`   - Nested submenus: 2`);
    console.log(`   - Deep nested: 1`);
  } catch (error) {
    console.error('❌ Error seeding menus:', error);
    throw error;
  }
};

export default seedMenus;
