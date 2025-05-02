import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting seed process...');

    // Clear existing data
    console.log('Clearing existing data...');
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.office.deleteMany();
    console.log('Existing data cleared successfully');

    // Create default office
    console.log('Creating default office...');
    const defaultOffice = await prisma.office.create({
      data: {
        name: 'Headquarters',
        code: 'HQ',
        isActive: true,
      },
    });
    console.log('Default office created:', defaultOffice);

    // Define permissions for each module
    console.log('Creating permissions...');
    const permissions = [
      // User Management
      { name: 'user:create', description: 'Create new users' },
      { name: 'user:read', description: 'View user information' },
      { name: 'user:update', description: 'Update user information' },
      { name: 'user:delete', description: 'Delete users' },
      { name: 'user:list', description: 'List all users' },
      { name: 'user:activate', description: 'Activate/deactivate users' },
      { name: 'user:assign-role', description: 'Assign roles to users' },
      { name: 'user:assign-office', description: 'Assign offices to users' },

      // Role Management
      { name: 'role:create', description: 'Create new roles' },
      { name: 'role:read', description: 'View role information' },
      { name: 'role:update', description: 'Update role information' },
      { name: 'role:delete', description: 'Delete roles' },
      { name: 'role:list', description: 'List all roles' },
      { name: 'role:assign-permissions', description: 'Assign permissions to roles' },

      // Permission Management
      { name: 'permission:create', description: 'Create new permissions' },
      { name: 'permission:read', description: 'View permission information' },
      { name: 'permission:update', description: 'Update permission information' },
      { name: 'permission:delete', description: 'Delete permissions' },
      { name: 'permission:list', description: 'List all permissions' },

      // Menu Management
      { name: 'menu:create', description: 'Create new menu items' },
      { name: 'menu:read', description: 'View menu information' },
      { name: 'menu:update', description: 'Update menu information' },
      { name: 'menu:delete', description: 'Delete menu items' },
      { name: 'menu:list', description: 'List all menu items' },
      { name: 'menu:assign-roles', description: 'Assign roles to menu items' },

      // Office Management
      { name: 'office:create', description: 'Create new offices' },
      { name: 'office:read', description: 'View office information' },
      { name: 'office:update', description: 'Update office information' },
      { name: 'office:delete', description: 'Delete offices' },
      { name: 'office:list', description: 'List all offices' },
      { name: 'office:assign-users', description: 'Assign users to offices' },

      // Authentication & Authorization
      { name: 'auth:login', description: 'Login to the system' },
      { name: 'auth:logout', description: 'Logout from the system' },
      { name: 'auth:refresh-token', description: 'Refresh authentication token' },
      { name: 'auth:change-password', description: 'Change user password' },
      { name: 'auth:reset-password', description: 'Reset user password' },

      // System Management
      { name: 'system:settings', description: 'Manage system settings' },
      { name: 'system:logs', description: 'View system logs' },
      { name: 'system:backup', description: 'Create system backups' },
      { name: 'system:restore', description: 'Restore system from backup' },
    ];

    // Create permissions
    const createdPermissions = await Promise.all(
      permissions.map((permission) =>
        prisma.permission.create({
          data: permission,
        })
      )
    );
    console.log(`Created ${createdPermissions.length} permissions`);

    // Define roles with their permissions
    console.log('Creating roles...');
    const roles = [
      {
        name: 'Super Admin',
        description: 'Has full access to all system features and settings',
        permissions: createdPermissions.map((p) => p.id),
      },
      {
        name: 'Administrator',
        description: 'Has access to manage users, roles, and basic system settings',
        permissions: createdPermissions
          .filter((p) => !p.name.startsWith('system:'))
          .map((p) => p.id),
      },
      {
        name: 'Manager',
        description: 'Can manage users and view reports',
        permissions: createdPermissions
          .filter(
            (p) =>
              p.name.startsWith('user:') ||
              p.name.startsWith('office:') ||
              p.name.startsWith('auth:')
          )
          .map((p) => p.id),
      },
      {
        name: 'User',
        description: 'Basic user with limited access',
        permissions: createdPermissions
          .filter(
            (p) =>
              p.name === 'auth:login' ||
              p.name === 'auth:logout' ||
              p.name === 'auth:change-password' ||
              p.name === 'user:read'
          )
          .map((p) => p.id),
      },
      {
        name: 'Guest',
        description: 'Limited access for external users',
        permissions: createdPermissions
          .filter((p) => p.name === 'auth:login' || p.name === 'auth:logout')
          .map((p) => p.id),
      },
    ];

    // Create roles with their permissions
    const createdRoles = await Promise.all(
      roles.map((role) =>
        prisma.role.create({
          data: {
            name: role.name,
            description: role.description,
            isActive: true,
            permissions: {
              connect: role.permissions.map((id) => ({ id })),
            },
          },
        })
      )
    );
    console.log('Created roles:', createdRoles.map((r) => r.name));

    // Create admin user
    console.log('Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin', 10);
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
        roleId: createdRoles.find((r) => r.name === 'Super Admin')!.id,
        officeId: defaultOffice.id,
      },
    });
    console.log('Admin user created:', adminUser);

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