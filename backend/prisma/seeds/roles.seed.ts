import { PrismaClient, Permission } from '@prisma/client';

export const roles = [
  {
    name: 'Super Admin',
    code: 'SUPER_ADMIN',
    description: 'Has full access to all system features and settings',
    permissions: (permissions: Permission[]) => permissions.map((p) => p.id),
  },
  {
    name: 'Administrator',
    code: 'ADMIN',
    description: 'Has access to manage users, roles, and basic system settings',
    permissions: (permissions: Permission[]) =>
      permissions.filter((p) => !p.name.startsWith('system:')).map((p) => p.id),
  },
  {
    name: 'Manager',
    code: 'MANAGER',
    description: 'Can manage users and view reports',
    permissions: (permissions: Permission[]) =>
      permissions
        .filter(
          (p) =>
            p.name.startsWith('user:') ||
            p.name.startsWith('office:') ||
            p.name.startsWith('auth:') ||
            p.name.startsWith('notification:')
        )
        .map((p) => p.id),
  },
  {
    name: 'User',
    code: 'USER',
    description: 'Basic user with limited access',
    permissions: (permissions: Permission[]) =>
      permissions
        .filter(
          (p) =>
            p.name === 'auth:login' ||
            p.name === 'auth:logout' ||
            p.name === 'auth:change-password' ||
            p.name === 'user:read' ||
            p.name === 'notification:read' ||
            p.name === 'notification:mark-read' ||
            p.name === 'notification:mark-all-read' ||
            p.name === 'notification:unread-count' ||
            p.name === 'notification:types'
        )
        .map((p) => p.id),
  },
  {
    name: 'Guest',
    code: 'GUEST',
    description: 'Limited access for external users',
    permissions: (permissions: Permission[]) =>
      permissions
        .filter((p) => p.name === 'auth:login' || p.name === 'auth:logout')
        .map((p) => p.id),
  },
  {
    name: 'Technician',
    code: 'TECHNICIAN',
    description: 'Can log in and manage assigned incidents. Has access to incident technician features.',
    permissions: (permissions: Permission[]) =>
      permissions
        .filter(
          (p) =>
            p.name === 'auth:login' ||
            p.name === 'auth:logout' ||
            p.name === 'auth:change-password' ||
            p.name === 'user:read' ||
            p.name === 'notification:read' ||
            p.name === 'notification:mark-read' ||
            p.name === 'notification:mark-all-read' ||
            p.name === 'notification:unread-count' ||
            p.name === 'notification:types'
        )
        .map((p) => p.id),
  },
];

export async function seedRoles(prisma: PrismaClient, permissions: Permission[]) {
  console.log('Creating roles...');
  const createdRoles = await Promise.all(
    roles.map((role) =>
      prisma.role.upsert({
        where: { name: role.name },
        update: {
          code: role.code,
          description: role.description,
          isActive: true,
          permissions: {
            set: role.permissions(permissions).map((id) => ({ id })),
          },
        },
        create: {
          name: role.name,
          code: role.code,
          description: role.description,
          isActive: true,
          permissions: {
            connect: role.permissions(permissions).map((id) => ({ id })),
          },
        },
      })
    )
  );
  console.log('Created/Updated roles:', createdRoles.map((r) => r.name));
  return createdRoles;
} 