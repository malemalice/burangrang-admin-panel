import { PrismaClient, Permission, Role, DataLevelEnum } from '@prisma/client';
import { notDeleted } from './not-deleted';

/** Health screening permissions for Guest (worker) role — must match permissions.seed names. */
const GUEST_HEALTH_SCREENING_PERMISSION_NAMES = [
  'health-screening:start',
  'health-screening:list',
  'health-screening:read',
  'health-screening:submit',
];

/** Contractor (work-permit worker) — work permit module + uploads + basics + health screening flow */
const CONTRACTOR_PERMISSION_NAMES = [
  ...GUEST_HEALTH_SCREENING_PERMISSION_NAMES,
  'auth:login',
  'auth:logout',
  'auth:change-password',
  'menu:read',
  'user:read',
  'setting:read',
  'setting:update',
  'notification:read',
  'notification:mark-read',
  'notification:mark-all-read',
  'notification:unread-count',
  'notification:types',
  'company:read',
  'company:list',
  'work-permit:create',
  'work-permit:read',
  'work-permit:update',
  'work-permit:delete',
  'work-permit:list',
  'upload:create',
  'upload:read',
  'upload:update',
  'upload:delete',
  'upload:list',
];

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
    'incident-security',
    'investigation-report',
    'ppe',
    'safety-equipment',
    'safety-equipment-type',
    'course',
    'chapter',
    'enrollment',
    'work-permit',
    'progress', // LMS: ProgressController requires progress:read / progress:update for course player
    'certificate', // full CRUD for HSE officers (was read/list-only; forms need create + certificate-category list)
    'upload', // attachments; backend POST /uploads/upload requires upload:create
    'risk',
    'risk-mitigation',
    'risk-category',
    'risk-matrix',
    'audit-period',
    'inspection-checklist',
    'hfacs-node',
  ];
  const quizPermissions = [
    'quiz:create',
    'quiz:read',
    'quiz:update',
    'quiz:delete',
    'quiz:list',
    'quiz:attempt',
  ];
  const healthQuizPermissions = [
    'health-quiz:create',
    'health-quiz:read',
    'health-quiz:update',
    'health-quiz:delete',
    'health-quiz:list',
  ];
  const healthScreeningPermissions = [
    'health-screening:start',
    'health-screening:list',
    'health-screening:read',
    'health-screening:submit',
  ];
  const readListOnlyModules = [
    'dashboard',
    'audit-policy',
    'audit-criteria',
    'audit-report',
    'certificate-category', // category dropdowns on certificate forms (GET /certificates/categories)
    'environmental-measurement',
    'waste-management',
    'man-hour',
    'kpi-hse-target',
  ];
  const actions = ['create', 'read', 'update', 'delete', 'list'] as const;
  const readListActions = ['read', 'list'] as const;
  const set = new Set<string>();
  for (const mod of fullModules) {
    for (const a of actions) set.add(`${mod}:${a}`);
  }
  for (const permission of quizPermissions) {
    set.add(permission);
  }
  for (const permission of healthQuizPermissions) {
    set.add(permission);
  }
  for (const permission of healthScreeningPermissions) {
    set.add(permission);
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
  set.add('company:read');
  set.add('company:list');
  return set;
}

const MANAGER_USER_PERMISSION_NAMES = getManagerUserPermissionNames();

export const roles = [
  {
    name: 'Super Admin',
    code: 'SUPER_ADMIN',
    description: 'Has full access to all system features and settings',
    dataLevel: DataLevelEnum.SUPER,
    permissions: (permissions: Permission[]) => permissions.map((p) => p.id),
  },
  {
    name: 'Administrator',
    code: 'ADMIN',
    description: 'All permissions to all modules except those under Settings menu',
    dataLevel: DataLevelEnum.SUPER,
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
      'Risk assessment, risk register, inspection, audit policy/criteria (read/list), incidents, incident security, certificates (full CRUD + certificate categories read/list), environmental (read/list), waste (read/list), man hour (read/list), PPE, training, LMS progress, quizzes, work permit, file uploads',
    dataLevel: DataLevelEnum.DEPARTMENT,
    permissions: (permissions: Permission[]) =>
      permissions
        .filter((p) => MANAGER_USER_PERMISSION_NAMES.has(p.name))
        .map((p) => p.id),
  },
  {
    name: 'User',
    code: 'USER',
    description:
      'Same as Manager: risk assessment, risk register, inspection, audit policy/criteria (read/list), incidents, incident security, certificates (full CRUD + certificate categories read/list), environmental (read/list), waste (read/list), man hour (read/list), PPE, training, LMS progress, quizzes, work permit, file uploads',
    dataLevel: DataLevelEnum.SELF,
    permissions: (permissions: Permission[]) =>
      permissions
        .filter((p) => MANAGER_USER_PERMISSION_NAMES.has(p.name))
        .map((p) => p.id),
  },
  {
    name: 'Guest',
    code: 'GUEST',
    description: 'Limited access for external users',
    dataLevel: DataLevelEnum.SELF,
    permissions: (permissions: Permission[]) =>
      permissions
        .filter(
          (p) =>
            p.name === 'auth:login' ||
            p.name === 'auth:logout' ||
            p.name === 'menu:read' ||
            GUEST_HEALTH_SCREENING_PERMISSION_NAMES.includes(p.name),
        )
        .map((p) => p.id),
  },
  {
    name: 'Contractor',
    code: 'CONTRACTOR',
    description:
      'External contractor user tied to a company; work permit access, uploads, and health screening',
    dataLevel: DataLevelEnum.SELF,
    permissions: (permissions: Permission[]) =>
      permissions
        .filter((p) => CONTRACTOR_PERMISSION_NAMES.includes(p.name))
        .map((p) => p.id),
  },
  {
    name: 'Technician',
    code: 'TECHNICIAN',
    description: 'Can log in and manage assigned incidents. Has access to incident technician features.',
    dataLevel: DataLevelEnum.SELF,
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
  {
    name: 'Embed Viewer',
    code: 'EMBED_VIEWER',
    description: 'Read-only access for embedded dashboard on Google Site. Used by /auth/embed/session.',
    dataLevel: DataLevelEnum.SUPER,
    permissions: (permissions: Permission[]) =>
      permissions
        .filter(
          (p) =>
            p.name === 'incident:list' ||
            p.name === 'menu:read' ||
            p.name === 'setting:read' ||
            p.name === 'setting:update' ||
            p.name === 'user:read' ||
            p.name === 'auth:login' ||
            p.name === 'auth:logout' ||
            p.name === 'auth:refresh-token'
        )
        .map((p) => p.id),
  },
];

export async function seedRoles(prisma: PrismaClient, permissions: Permission[]) {
  console.log('Creating roles...');
  const createdRoles: Role[] = [];
  for (const role of roles) {
    const existing = await prisma.role.findFirst({
      where: { name: role.name, ...notDeleted },
    });
    const permIds = role.permissions(permissions).map((id) => ({ id }));
    if (existing) {
      createdRoles.push(
        await prisma.role.update({
          where: { id: existing.id },
          data: {
            code: role.code,
            description: role.description,
            isActive: true,
            dataLevel: role.dataLevel,
            permissions: { set: permIds },
          },
        }),
      );
    } else {
      createdRoles.push(
        await prisma.role.create({
          data: {
            name: role.name,
            code: role.code,
            description: role.description,
            isActive: true,
            dataLevel: role.dataLevel,
            permissions: { connect: permIds },
          },
        }),
      );
    }
  }
  console.log('Created/Updated roles:', createdRoles.map((r) => r.name));
  return createdRoles;
} 
