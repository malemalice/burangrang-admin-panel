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

    await prisma.menu.create({
      data: {
        name: 'Risk Assessment',
        path: '/risk-assessment',
        icon: 'ClipboardCheck',
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

    const masterDataMenu = await prisma.menu.create({
      data: {
        name: 'Master Data',
        icon: 'Building2',
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

    const userManagementMenu = await prisma.menu.create({
      data: {
        name: 'User Management',
        icon: 'Users',
        order: 4,
        isActive: true,
        roles: {
          connect: [{ id: superAdminRole.id }, { id: adminRole.id }],
        },
      },
    });

    await prisma.menu.create({
      data: {
        name: 'Notifications',
        path: '/notifications',
        icon: 'Bell',
        order: 5,
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

    await prisma.menu.create({
      data: {
        name: 'Settings',
        path: '/settings',
        icon: 'Settings',
        order: 6,
        isActive: true,
        roles: {
          connect: [{ id: superAdminRole.id }, { id: adminRole.id }],
        },
      },
    });

    const ppeMenu = await prisma.menu.create({
      data: {
        name: 'PPE Management',
        icon: 'Shield',
        order: 7,
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

    const certificateMenu = await prisma.menu.create({
      data: {
        name: 'Certificate Management',
        icon: 'Award',
        order: 8,
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

    // Create Certificate Management submenus
    await prisma.menu.create({
      data: {
        name: 'Certificates',
        path: '/certificates',
        icon: 'Award',
        parentId: certificateMenu.id,
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
        name: 'Categories',
        path: '/master/certificate-categories',
        icon: 'Tag',
        parentId: certificateMenu.id,
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
        name: 'Safety Equipment Types',
        path: '/master/safety-equipment-types',
        icon: 'Tag',
        parentId: ppeMenu.id,
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
        name: 'Safety Equipment',
        path: '/master/safety-equipments',
        icon: 'Shield',
        parentId: ppeMenu.id,
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

    // Create PPE submenus
    await prisma.menu.create({
      data: {
        name: 'Stock In',
        path: '/ppe/stocks',
        icon: 'Package',
        parentId: ppeMenu.id,
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
        name: 'Withdraw',
        path: '/ppe/withdrawals',
        icon: 'LogOut',
        parentId: ppeMenu.id,
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
        name: 'HSE Categories',
        path: '/master/hse-categories',
        icon: 'ShieldAlert',
        parentId: masterDataMenu.id,
        order: 4,
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
        name: 'Threats',
        path: '/master/threats',
        icon: 'AlertTriangle',
        parentId: masterDataMenu.id,
        order: 5,
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
        name: 'Threat Mitigations',
        path: '/master/threat-mitigations',
        icon: 'Shield',
        parentId: masterDataMenu.id,
        order: 6,
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
        order: 7,
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
        parentId: userManagementMenu.id,
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
        icon: 'ShieldCheck',
        parentId: userManagementMenu.id,
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
        parentId: userManagementMenu.id,
        order: 3,
        isActive: true,
        roles: {
          connect: [{ id: superAdminRole.id }, { id: adminRole.id }],
        },
      },
    });

    console.log('✅ Menus seeded successfully');
    console.log(`   - Created ${await prisma.menu.count()} menu items`);
    console.log(`   - Top-level menus: 8`);
    console.log(`   - Master Data submenus: 9`);
    console.log(`   - User Management submenus: 3`);
    console.log(`   - PPE Management submenus: 2`);
    console.log(`   - Certificate Management submenus: 2`);
  } catch (error) {
    console.error('❌ Error seeding menus:', error);
    throw error;
  }
};

export default seedMenus;
