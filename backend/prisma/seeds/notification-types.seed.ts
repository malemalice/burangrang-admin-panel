import { seedPrisma as prisma } from './prisma-seed-client';

export async function seedNotificationTypes() {
  console.log('🌱 Seeding notification types...');

  const notificationTypes = [
    {
      name: 'user_activity',
      description: 'User management activities (create, update, delete users)',
    },
    {
      name: 'role_activity',
      description: 'Role management activities (create, update, delete roles)',
    },
    {
      name: 'system_activity',
      description: 'System-wide activities and updates',
    },
    {
      name: 'approval_activity',
      description: 'Approval workflow activities',
    },
    {
      name: 'office_activity',
      description: 'Office management activities',
    },
    {
      name: 'department_activity',
      description: 'Department management activities',
    },
    {
      name: 'job_position_activity',
      description: 'Job position management activities',
    },
    {
      name: 'menu_activity',
      description: 'Menu management activities',
    },
    {
      name: 'settings_activity',
      description: 'Settings management activities',
    },
    {
      name: 'general_activity',
      description: 'General application activities',
    },
    {
      name: 'WORK_PERMIT_SUBMITTED',
      description: 'Work permit submitted for review',
    },
    {
      name: 'WORK_PERMIT_NEED_INFO',
      description: 'Work permit needs additional information',
    },
    {
      name: 'WORK_PERMIT_APPROVED',
      description: 'Work permit approved',
    },
    {
      name: 'WORK_PERMIT_REJECTED',
      description: 'Work permit rejected',
    },
    {
      name: 'WORK_PERMIT_EXTENDED',
      description: 'Work permit extended',
    },
    {
      name: 'WORK_PERMIT_CLOSED',
      description: 'Work permit closed',
    },
    {
      name: 'WORK_PERMIT_EXPIRING_SOON',
      description: 'Work permit expiring soon reminder',
    },
    {
      name: 'WORK_PERMIT_FORWARDED_TO_SECURITY',
      description: 'Work permit forwarded to Security for review',
    },
  ];

  for (const type of notificationTypes) {
    await prisma.notificationType.upsert({
      where: { name: type.name },
      update: type,
      create: type,
    });
  }

  console.log('✅ Notification types seeded successfully');
}

export async function seedSampleNotifications() {
  console.log('🌱 Seeding sample notifications...');

  // Get the first user and role for sample notifications
  const firstUser = await prisma.user.findFirst({
    where: { isActive: true },
    include: { role: true },
  });

  if (!firstUser) {
    console.log('⚠️ No users found, skipping sample notifications');
    return;
  }

  // Get notification types
  const userActivityType = await prisma.notificationType.findUnique({
    where: { name: 'user_activity' },
  });

  const systemActivityType = await prisma.notificationType.findUnique({
    where: { name: 'system_activity' },
  });

  if (!userActivityType || !systemActivityType) {
    console.log('⚠️ Notification types not found, skipping sample notifications');
    return;
  }

  // Get all roles for sample notifications
  const roles = await prisma.role.findMany({
    where: { isActive: true },
  });

  if (roles.length === 0) {
    console.log('⚠️ No roles found, skipping sample notifications');
    return;
  }

  // Create sample notifications
  const sampleNotifications = [
    {
      title: 'Welcome to the System',
      message: 'Welcome to the BurangrangAdmin Panel! Your account has been successfully created.',
      context: 'system',
      contextId: firstUser.id,
      typeId: systemActivityType.id,
      createdBy: firstUser.id,
    },
    {
      title: 'User Management Activity',
      message: `User ${firstUser.firstName} ${firstUser.lastName} has been created successfully.`,
      context: 'users',
      contextId: firstUser.id,
      typeId: userActivityType.id,
      createdBy: firstUser.id,
    },
    {
      title: 'System Update',
      message: 'The system has been updated with new features and improvements.',
      context: 'system',
      contextId: null,
      typeId: systemActivityType.id,
      createdBy: firstUser.id,
    },
  ];

  for (const notificationData of sampleNotifications) {
    const notification = await prisma.notification.create({
      data: {
        ...notificationData,
        recipients: {
          create: roles.map(role => ({
            roleId: role.id,
          })),
        },
      },
    });

    console.log(`📧 Created sample notification: ${notification.title}`);
  }

  console.log('✅ Sample notifications seeded successfully');
}

export async function seedNotifications() {
  await seedNotificationTypes();
  await seedSampleNotifications();
}
