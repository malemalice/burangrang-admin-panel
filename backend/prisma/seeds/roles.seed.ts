import { PrismaClient, Permission } from '@prisma/client';

/** Permission names that belong to modules under the Settings menu (Admin excludes these). */
const SETTINGS_PERMISSION_PREFIXES = ['setting:', 'mail-template:', 'reminder:'];

/** Setting permissions allowed for all roles (sidebar + theme). Admin gets these despite SETTINGS_PERMISSION_PREFIXES. */
const SETTINGS_ALLOWED_FOR_ALL = new Set(['setting:read', 'setting:update']);

/** Permission names allowed for Manager and User (same set for both). */
function getManagerUserPermissionNames(): Set<string> {
  const fullModules = [
    'risk-assessment',
    'risk-register',
    'inspection',
    'incident',
    'ppe',
    'safety-equipment',
    'safety-equipment-type',
    'course',
    'chapter',
    'enrollment',
    'quiz',
    'work-permit',
    'risk',
    'risk-mitigation',
    'risk-category',
    'risk-matrix',
  ];
  const readListOnlyModules = [
    'audit-policy',
    'audit-criteria',
    'certificate',
    'environmental-measurement',
    'waste-management',
    'man-hour',
  ];
  const actions = ['create', 'read', 'update', 'delete', 'list'] as const;
  const readListActions = ['read', 'list'] as const;
  const set = new Set<string>();
  for (const mod of fullModules) {
    for (const a of actions) set.add(`${mod}:${a}`);
  }
  for (const mod of readListOnlyModules) {
    for (const a of readListActions) set.add(`${mod}:${a}`);
  }
  set.add('auth:login');
  set.add('auth:logout');
  set.add('auth:change-password');
  set.add('auth:refresh-token');
  set.add('user:read');
  set.add('menu:read');
  set.add('setting:read');
  set.add('setting:update');
  set.add('notification:read');
  set.add('notification:mark-read');
  set.add('notification:mark-all-read');
  set.add('notification:unread-count');
  set.add('notification:types');
  return set;
}

const MANAGER_USER_PERMISSION_NAMES = getManagerUserPermissionNames();

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
    description: 'All permissions to all modules except those under Settings menu',
    permissions: (permissions: Permission[]) =>
      permissions
        .filter(
          (p) =>
            SETTINGS_ALLOWED_FOR_ALL.has(p.name) ||
            !SETTINGS_PERMISSION_PREFIXES.some((prefix) => p.name.startsWith(prefix))
        )
        .map((p) => p.id),
  },
  {
    name: 'Manager',
    code: 'MANAGER',
    description:
      'Risk assessment, risk register, inspection, audit policy/criteria (read/list), incidents, certificates (read/list), environmental (read/list), waste (read/list), man hour (read/list), PPE, training, quizzes, work permit',
    permissions: (permissions: Permission[]) =>
      permissions
        .filter((p) => MANAGER_USER_PERMISSION_NAMES.has(p.name))
        .map((p) => p.id),
  },
  {
    name: 'User',
    code: 'USER',
    description:
      'Same as Manager: risk assessment, risk register, inspection, audit policy/criteria (read/list), incidents, certificates (read/list), environmental (read/list), waste (read/list), man hour (read/list), PPE, training, quizzes, work permit',
    permissions: (permissions: Permission[]) =>
      permissions
        .filter((p) => MANAGER_USER_PERMISSION_NAMES.has(p.name))
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
            p.name === 'menu:read' ||
            p.name === 'setting:read' ||
            p.name === 'setting:update' ||
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