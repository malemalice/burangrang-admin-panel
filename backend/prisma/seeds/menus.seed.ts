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

    // Environmental Measurements menu
    await prisma.menu.create({
      data: {
        name: 'Environmental Measurements',
        path: '/environmental-measurements',
        icon: 'Thermometer',
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

    const masterDataMenu = await prisma.menu.create({
      data: {
        name: 'Master Data',
        icon: 'Building2',
        order: 96,
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
        order: 97,
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
        order: 98,
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
            { id: userRole.id },
          ],
        },
      },
    });

    const trainingMenu = await prisma.menu.create({
      data: {
        name: 'Training',
        icon: 'GraduationCap',
        order: 9,
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
            { id: userRole.id },
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
        name: 'Risk Categories',
        path: '/master/risk-categories',
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
        name: 'Risks',
        path: '/master/risks',
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
        name: 'Risk Mitigations',
        path: '/master/risk-mitigations',
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
        name: 'Areas',
        path: '/master/areas',
        icon: 'MapPin',
        parentId: masterDataMenu.id,
        order: 7,
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
        order: 9,
        isActive: true,
        roles: {
          connect: [{ id: superAdminRole.id }, { id: adminRole.id }],
        },
      },
    });

    await prisma.menu.create({
      data: {
        name: 'Rooms',
        path: '/master/rooms',
        icon: 'DoorOpen',
        parentId: masterDataMenu.id,
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

    // Create Training submenus
    await prisma.menu.create({
      data: {
        name: 'Courses',
        path: '/courses',
        icon: 'BookOpen',
        parentId: trainingMenu.id,
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
        name: 'Course Enrollments',
        path: '/enrollments',
        icon: 'Users',
        parentId: trainingMenu.id,
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

    // Create Quizzes menu - accessible to admins and managers for quiz management
    await prisma.menu.create({
      data: {
        name: 'Quizzes',
        path: '/quizzes',
        icon: 'FileQuestion',
        order: 10,
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

    // Create Work Permit menu - accessible to all users
    const workPermitMenu = await prisma.menu.create({
      data: {
        name: 'Work Permit',
        icon: 'FileText',
        path: '/work-permits',
        order: 8,
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

    // Create Reminders menu - accessible to all users for reminder management
    await prisma.menu.create({
      data: {
        name: 'Reminders',
        path: '/reminders',
        icon: 'Clock',
        parentId: settingsMenu.id,
        order: 9,
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
        name: 'General Settings',
        path: '/settings',
        icon: 'Gear',
        parentId: settingsMenu.id,
        order: 11,
        isActive: true,
        roles: {
          connect: [{ id: superAdminRole.id }, { id: adminRole.id }],
        },
      },
    });

    await prisma.menu.create({
      data: {
        name: 'Application Settings',
        path: '/settings/application',
        icon: 'Gear',
        parentId: settingsMenu.id,
        order: 10,
        isActive: true,
        roles: {
          connect: [{ id: superAdminRole.id }, { id: adminRole.id }],
        },
      },
    });

    // Create Waste Management menu
    const wasteManagementMenu = await prisma.menu.create({
      data: {
        name: 'Waste Management',
        icon: 'Recycle',
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

    // Waste Management - Wastewater submenus
    await prisma.menu.create({
      data: {
        name: 'Waste Water Flow Recording',
        path: '/waste-management/monthly-flow-reports',
        icon: 'Waves',
        parentId: wasteManagementMenu.id,
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
        name: 'Waste Water Lab Results',
        path: '/waste-management/water-quality-lab-reports',
        icon: 'FlaskConical',
        parentId: wasteManagementMenu.id,
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

    // Waste Management - Solid Waste submenus
    await prisma.menu.create({
      data: {
        name: 'Solid Waste Recording',
        path: '/waste-management/weight-reports',
        icon: 'Scale',
        parentId: wasteManagementMenu.id,
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
        name: 'Dispatch Orders',
        path: '/waste-management/dispatch-orders',
        icon: 'Truck',
        parentId: wasteManagementMenu.id,
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

    // Waste Management - Master Data submenus
    await prisma.menu.create({
      data: {
        name: 'Treatment Plants',
        path: '/waste-management/treatment-plants',
        icon: 'Factory',
        parentId: wasteManagementMenu.id,
        order: 5,
        isActive: true,
        roles: {
          connect: [{ id: superAdminRole.id }, { id: adminRole.id }],
        },
      },
    });

    await prisma.menu.create({
      data: {
        name: 'Water Quality Parameters',
        path: '/waste-management/water-quality-parameters',
        icon: 'Droplets',
        parentId: wasteManagementMenu.id,
        order: 6,
        isActive: true,
        roles: {
          connect: [{ id: superAdminRole.id }, { id: adminRole.id }],
        },
      },
    });

    await prisma.menu.create({
      data: {
        name: 'Waste Types',
        path: '/waste-management/waste-types',
        icon: 'Tags',
        parentId: wasteManagementMenu.id,
        order: 7,
        isActive: true,
        roles: {
          connect: [{ id: superAdminRole.id }, { id: adminRole.id }],
        },
      },
    });

    await prisma.menu.create({
      data: {
        name: 'Waste Sources',
        path: '/waste-management/waste-sources',
        icon: 'Building',
        parentId: wasteManagementMenu.id,
        order: 8,
        isActive: true,
        roles: {
          connect: [{ id: superAdminRole.id }, { id: adminRole.id }],
        },
      },
    });

    await prisma.menu.create({
      data: {
        name: 'Storage Locations',
        path: '/waste-management/storage-locations',
        icon: 'Warehouse',
        parentId: wasteManagementMenu.id,
        order: 9,
        isActive: true,
        roles: {
          connect: [{ id: superAdminRole.id }, { id: adminRole.id }],
        },
      },
    });


    await prisma.menu.create({
      data: {
        name: 'Risk Matrix',
        path: '/risk-matrix',
        icon: 'Grid',
        order: 3,
        isActive: true,
        parentId: masterDataMenu.id,
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

    console.log(`   - Created ${await prisma.menu.count()} menu items`);
    console.log(`   - Top-level menus: 9`);
    console.log(`   - Master Data submenus: 9`);
    console.log(`   - User Management submenus: 3`);
    console.log(`   - PPE Management submenus: 2`);
    console.log(`   - Certificate Management submenus: 2`);
    console.log(`   - Work Permit submenus: 2`);
  } catch (error) {
    console.error('❌ Error seeding menus:', error);
    throw error;
  }
};

export default seedMenus;
