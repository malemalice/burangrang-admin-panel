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

  // Settings Management
  { name: 'setting:create', description: 'Create new settings' },
  { name: 'setting:read', description: 'View setting information' },
  { name: 'setting:update', description: 'Update setting information' },
  { name: 'setting:delete', description: 'Delete settings' },
  { name: 'setting:list', description: 'List all settings' },

  // System Management
  { name: 'system:settings', description: 'Manage system settings' },
  { name: 'system:logs', description: 'View system logs' },
  { name: 'system:backup', description: 'Create system backups' },
  { name: 'system:restore', description: 'Restore system from backup' },

  // Notification Management
  { name: 'notification:create', description: 'Create new notifications' },
  { name: 'notification:read', description: 'View notifications' },
  { name: 'notification:update', description: 'Update notifications' },
  { name: 'notification:delete', description: 'Delete notifications' },
  { name: 'notification:list', description: 'List all notifications' },
  { name: 'notification:mark-read', description: 'Mark notifications as read' },
  { name: 'notification:mark-all-read', description: 'Mark all notifications as read' },
  { name: 'notification:unread-count', description: 'View unread notification count' },
  { name: 'notification:types', description: 'View notification types' },

  // Approval Management
  { name: 'approval:create', description: 'Create new approvals' },
  { name: 'approval:read', description: 'View approvals' },
  { name: 'approval:update', description: 'Update approvals' },
  { name: 'approval:delete', description: 'Delete approvals' },
  { name: 'approval:list', description: 'List all approvals' },

  // Job Position Management
  { name: 'job-position:create', description: 'Create new job positions' },
  { name: 'job-position:read', description: 'View job positions' },
  { name: 'job-position:update', description: 'Update job positions' },
  { name: 'job-position:delete', description: 'Delete job positions' },
  { name: 'job-position:list', description: 'List all job positions' },

  // Department Management
  { name: 'department:create', description: 'Create new departments' },
  { name: 'department:read', description: 'View departments' },
  { name: 'department:update', description: 'Update departments' },
  { name: 'department:delete', description: 'Delete departments' },
  { name: 'department:list', description: 'List all departments' },

  // Course Management
  { name: 'course:create', description: 'Create new courses' },
  { name: 'course:read', description: 'View course information' },
  { name: 'course:update', description: 'Update course information' },
  { name: 'course:delete', description: 'Delete courses' },
  { name: 'course:list', description: 'List all courses' },
  { name: 'course:publish', description: 'Publish/unpublish courses' },
  { name: 'course:assign-instructor', description: 'Assign instructors to courses' },
  { name: 'course:manage-categories', description: 'Manage course categories' },
  { name: 'course:view-analytics', description: 'View course analytics' },

  // Chapter Management
  { name: 'chapter:create', description: 'Create new chapters' },
  { name: 'chapter:read', description: 'View chapter information' },
  { name: 'chapter:update', description: 'Update chapter information' },
  { name: 'chapter:delete', description: 'Delete chapters' },
  { name: 'chapter:list', description: 'List all chapters' },
  { name: 'chapter:reorder', description: 'Reorder chapters' },
  { name: 'chapter:publish', description: 'Publish/unpublish chapters' },
  { name: 'chapter:manage-content', description: 'Manage chapter content' },
];

export async function seedPermissions(prisma: PrismaClient) {
  console.log('Creating permissions...');
  const createdPermissions = await Promise.all(
    permissions.map((permission) =>
      prisma.permission.upsert({
        where: { name: permission.name },
        update: permission,
        create: permission,
      })
    )
  );
  console.log(`Created/Updated ${createdPermissions.length} permissions`);
  return createdPermissions;
} 