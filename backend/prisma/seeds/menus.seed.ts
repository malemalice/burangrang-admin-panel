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

    // Dashboard menu group (parent + sub-modules)
    const dashboardMenu = await prisma.menu.create({
      data: {
        name: 'Dashboard',
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
        name: 'Overview',
        path: '/',
        icon: 'LayoutDashboard',
        parentId: dashboardMenu.id,
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
        name: 'Hazard Analytics',
        path: '/dashboard/hazard-analytics',
        icon: 'AlertTriangle',
        parentId: dashboardMenu.id,
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
        name: 'Incident Profile Analytic',
        path: '/dashboard/incident-profile-analytic',
        icon: 'Users',
        parentId: dashboardMenu.id,
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

    await prisma.menu.create({
      data: {
        name: 'KPI Frequency Rate',
        path: '/dashboard/kpi-frequency-rate',
        icon: 'BarChart3',
        parentId: dashboardMenu.id,
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

    await prisma.menu.create({
      data: {
        name: 'KPI HSE Target',
        path: '/dashboard/kpi-hse-target',
        icon: 'Target',
        parentId: dashboardMenu.id,
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
        name: 'Security Team',
        path: '/dashboard/security-team',
        icon: 'Shield',
        parentId: dashboardMenu.id,
        order: 6,
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
        name: 'Admin Overview',
        path: '/dashboard/admin-overview',
        icon: 'LayoutDashboard',
        parentId: dashboardMenu.id,
        order: 7,
        isActive: true,
        roles: {
          connect: [
            { id: superAdminRole.id },
            { id: adminRole.id },
          ],
        },
      },
    });

    // Risk Assessment menu group (risk-related modules except Risk Register)
    const riskAssessmentMenu = await prisma.menu.create({
      data: {
        name: 'Risk Assessment',
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

    // Risk Assessment submenus
    await prisma.menu.create({
      data: {
        name: 'Risk Assessment',
        path: '/risk-assessment',
        icon: 'ClipboardCheck',
        parentId: riskAssessmentMenu.id,
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
        name: 'Risk Matrix',
        path: '/risk-matrix',
        icon: 'Grid',
        parentId: riskAssessmentMenu.id,
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
        name: 'Risk Categories',
        path: '/master/risk-categories',
        icon: 'ShieldAlert',
        parentId: riskAssessmentMenu.id,
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
        name: 'Risks',
        path: '/master/risks',
        icon: 'AlertTriangle',
        parentId: riskAssessmentMenu.id,
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
        name: 'Risk Mitigations Template',
        path: '/master/risk-mitigations',
        icon: 'Shield',
        parentId: riskAssessmentMenu.id,
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
        name: 'Risk Register',
        path: '/risk-register',
        icon: 'ShieldAlert',
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

    // Inspection menu group
    const inspectionMenu = await prisma.menu.create({
      data: {
        name: 'Inspection',
        icon: 'Search',
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

    // Inspection Schedules submenu
    await prisma.menu.create({
      data: {
        name: 'Inspection Schedules',
        path: '/inspections',
        icon: 'Calendar',
        parentId: inspectionMenu.id,
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

    // Inspection Items submenu
    await prisma.menu.create({
      data: {
        name: 'Inspection Items',
        path: '/inspections/items',
        icon: 'ClipboardList',
        parentId: inspectionMenu.id,
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

    // Audit menu group
    const auditMenu = await prisma.menu.create({
      data: {
        name: 'Audit',
        icon: 'FileCheck',
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

    // Audit Schedules submenu
    await prisma.menu.create({
      data: {
        name: 'Audit Schedules',
        path: '/audit-schedules',
        icon: 'Calendar',
        parentId: auditMenu.id,
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

    // Audit Results submenu
    await prisma.menu.create({
      data: {
        name: 'Audit Results',
        path: '/audit-results',
        icon: 'FileCheck2',
        parentId: auditMenu.id,
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

    // Audit Policy submenu
    await prisma.menu.create({
      data: {
        name: 'Audit Policy',
        path: '/audit-policy',
        icon: 'FileCheck',
        parentId: auditMenu.id,
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

    // Audit Criteria submenu
    await prisma.menu.create({
      data: {
        name: 'Audit Criteria',
        path: '/audit-criteria',
        icon: 'ClipboardList',
        parentId: auditMenu.id,
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

    // Incidents menu (top-level)
    await prisma.menu.create({
      data: {
        name: 'Incidents',
        path: '/incidents',
        icon: 'AlertTriangle',
        order: 6,
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

    // Incident Securities menu (top-level) - security incidents
    await prisma.menu.create({
      data: {
        name: 'Incident Securities',
        path: '/incident-securities',
        icon: 'ShieldAlert',
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

    // Environmental Measurements menu
    await prisma.menu.create({
      data: {
        name: 'Environmental Measurements',
        path: '/environmental-measurements',
        icon: 'Thermometer',
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
        order: 11,
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
        order: 12,
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
        order: 13,
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
            { id: userRole.id },
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

    await prisma.menu.create({
      data: {
        name: 'Email Templates',
        path: '/mail-templates',
        icon: 'Mail',
        parentId: settingsMenu.id,
        order: 2,
        isActive: true,
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
        name: 'Areas',
        path: '/master/areas',
        icon: 'MapPin',
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
        name: 'Rooms',
        path: '/master/rooms',
        icon: 'DoorOpen',
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
        name: 'Approvals',
        path: '/master/approvals',
        icon: 'ShieldCheck',
        parentId: masterDataMenu.id,
        order: 6,
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

    // Create Quizzes menu - accessible to admins, managers and users
    await prisma.menu.create({
      data: {
        name: 'Quizzes',
        path: '/quizzes',
        icon: 'FileQuestion',
        order: 14,
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

    // Create Work Permit menu - accessible to all users
    await prisma.menu.create({
      data: {
        name: 'Work Permit',
        icon: 'FileText',
        path: '/work-permits',
        order: 15,
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
        icon: 'Cog',
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
        icon: 'Cog',
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

    // Waste Management - Wastewater submenus (Manager/User: read & list only)
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
            { id: userRole.id },
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
            { id: userRole.id },
          ],
        },
      },
    });

    // Waste Management - Solid Waste submenus (Manager/User: read & list only)
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
            { id: userRole.id },
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
            { id: userRole.id },
          ],
        },
      },
    });

    // Waste Management - Master Data submenus (Manager/User: read & list only)
    await prisma.menu.create({
      data: {
        name: 'Treatment Plants',
        path: '/waste-management/treatment-plants',
        icon: 'Factory',
        parentId: wasteManagementMenu.id,
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
        name: 'Water Quality Parameters',
        path: '/waste-management/water-quality-parameters',
        icon: 'Droplets',
        parentId: wasteManagementMenu.id,
        order: 6,
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
        name: 'Waste Types',
        path: '/waste-management/waste-types',
        icon: 'Tags',
        parentId: wasteManagementMenu.id,
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

    await prisma.menu.create({
      data: {
        name: 'Waste Sources',
        path: '/waste-management/waste-sources',
        icon: 'Building',
        parentId: wasteManagementMenu.id,
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

    await prisma.menu.create({
      data: {
        name: 'Storage Locations',
        path: '/waste-management/storage-locations',
        icon: 'Warehouse',
        parentId: wasteManagementMenu.id,
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

    // Man Hour Management Menu
    const manHourMenu = await prisma.menu.create({
      data: {
        name: 'Man Hour',
        icon: 'Clock',
        order: 10,
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
        name: 'Manage Man Hour',
        path: '/man-hours',
        icon: 'ClipboardList',
        parentId: manHourMenu.id,
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
        name: 'Man Hour Report',
        path: '/man-hours/report',
        icon: 'BarChart3',
        parentId: manHourMenu.id,
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

    console.log(`   - Created ${await prisma.menu.count()} menu items`);
    console.log(`   - Dashboard submenus: 6`);
    console.log(`   - Top-level menus: 16 (including Incident Securities)`);
    console.log(`   - Risk Assessment submenus: 5`);
    console.log(`   - Master Data submenus: 6`);
    console.log(`   - User Management submenus: 3`);
    console.log(`   - Audit submenus: 4`);
    console.log(`   - Inspection submenus: 2`);
    console.log(`   - PPE Management submenus: 2`);
    console.log(`   - Certificate Management submenus: 2`);
    console.log(`   - Work Permit submenus: 2`);
    console.log(`   - Man Hour submenus: 2`);
  } catch (error) {
    console.error('❌ Error seeding menus:', error);
    throw error;
  }
};

export default seedMenus;
