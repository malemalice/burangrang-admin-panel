import { PrismaClient } from '@prisma/client';

export const permissions = [
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

export async function seedPermissions(prisma: PrismaClient) {
  console.log('Creating permissions...');
  const createdPermissions = await Promise.all(
    permissions.map((permission) =>
      prisma.permission.create({
        data: permission,
      })
    )
  );
  console.log(`Created ${createdPermissions.length} permissions`);
  return createdPermissions;
} 