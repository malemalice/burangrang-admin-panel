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

  // Dashboard (analytics / overview)
  { name: 'dashboard:read', description: 'View dashboard and analytics' },
  { name: 'dashboard:list', description: 'List dashboard data' },
  { name: 'dashboard:admin-overview:read', description: 'View admin overview dashboard (executive-level metrics)' },

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

  // Area Management
  { name: 'area:create', description: 'Create new areas' },
  { name: 'area:read', description: 'View area information' },
  { name: 'area:update', description: 'Update area information' },
  { name: 'area:delete', description: 'Delete areas' },
  { name: 'area:list', description: 'List all areas' },

  // Asset Management
  { name: 'asset:create', description: 'Create new assets' },
  { name: 'asset:read', description: 'View asset information' },
  { name: 'asset:update', description: 'Update asset information' },
  { name: 'asset:delete', description: 'Delete assets' },
  { name: 'asset:list', description: 'List all assets' },

  // Risk Assessment Management
  { name: 'risk-assessment:create', description: 'Create new risk assessments' },
  { name: 'risk-assessment:read', description: 'View risk assessment information' },
  { name: 'risk-assessment:update', description: 'Update risk assessment information' },
  { name: 'risk-assessment:delete', description: 'Delete risk assessments' },
  { name: 'risk-assessment:list', description: 'List all risk assessments' },

  // Quiz Management
  { name: 'quiz:create', description: 'Create new quizzes' },
  { name: 'quiz:read', description: 'View quiz information' },
  { name: 'quiz:update', description: 'Update quiz information' },
  { name: 'quiz:delete', description: 'Delete quizzes' },
  { name: 'quiz:list', description: 'List all quizzes' },
  { name: 'quiz:publish', description: 'Publish/unpublish quizzes' },

  // Incident Management
  { name: 'incident:create', description: 'Create new incidents' },
  { name: 'incident:read', description: 'View incident information' },
  { name: 'incident:update', description: 'Update incident information' },
  { name: 'incident:delete', description: 'Delete incidents' },
  { name: 'incident:list', description: 'List all incidents' },

  // Incident Security Management
  { name: 'incident-security:create', description: 'Create new security incidents' },
  { name: 'incident-security:read', description: 'View security incident information' },
  { name: 'incident-security:update', description: 'Update security incident information' },
  { name: 'incident-security:delete', description: 'Delete security incidents' },
  { name: 'incident-security:list', description: 'List all security incidents' },

  // Audit Schedule Management
  { name: 'audit-schedule:create', description: 'Create new audit schedules' },
  { name: 'audit-schedule:read', description: 'View audit schedule information' },
  { name: 'audit-schedule:update', description: 'Update audit schedule information' },
  { name: 'audit-schedule:delete', description: 'Delete audit schedules' },
  { name: 'audit-schedule:list', description: 'List all audit schedules' },

  // Risk Register Management
  { name: 'risk-register:create', description: 'Create new risk register entries' },
  { name: 'risk-register:read', description: 'View risk register information' },
  { name: 'risk-register:update', description: 'Update risk register information' },
  { name: 'risk-register:delete', description: 'Delete risk register entries' },
  { name: 'risk-register:list', description: 'List all risk register entries' },

  // Progress Management
  { name: 'progress:create', description: 'Create new progress records' },
  { name: 'progress:read', description: 'View progress information' },
  { name: 'progress:update', description: 'Update progress information' },
  { name: 'progress:delete', description: 'Delete progress records' },
  { name: 'progress:list', description: 'List all progress records' },

  // Inspection Management
  { name: 'inspection:create', description: 'Create new inspections' },
  { name: 'inspection:read', description: 'View inspection information' },
  { name: 'inspection:update', description: 'Update inspection information' },
  { name: 'inspection:delete', description: 'Delete inspections' },
  { name: 'inspection:list', description: 'List all inspections' },

  // Certificate Management
  { name: 'certificate:create', description: 'Create new certificates' },
  { name: 'certificate:read', description: 'View certificate information' },
  { name: 'certificate:update', description: 'Update certificate information' },
  { name: 'certificate:delete', description: 'Delete certificates' },
  { name: 'certificate:list', description: 'List all certificates' },

  // Audit Policy Management
  { name: 'audit-policy:create', description: 'Create new audit policies' },
  { name: 'audit-policy:read', description: 'View audit policy information' },
  { name: 'audit-policy:update', description: 'Update audit policy information' },
  { name: 'audit-policy:delete', description: 'Delete audit policies' },
  { name: 'audit-policy:list', description: 'List all audit policies' },

  // Work Permit Management
  { name: 'work-permit:create', description: 'Create new work permits' },
  { name: 'work-permit:read', description: 'View work permit information' },
  { name: 'work-permit:update', description: 'Update work permit information' },
  { name: 'work-permit:delete', description: 'Delete work permits' },
  { name: 'work-permit:list', description: 'List all work permits' },

  // Enrollment Management
  { name: 'enrollment:create', description: 'Create new enrollments' },
  { name: 'enrollment:read', description: 'View enrollment information' },
  { name: 'enrollment:update', description: 'Update enrollment information' },
  { name: 'enrollment:delete', description: 'Delete enrollments' },
  { name: 'enrollment:list', description: 'List all enrollments' },

  // Master Approval Management
  { name: 'master-approval:create', description: 'Create new master approvals' },
  { name: 'master-approval:read', description: 'View master approval information' },
  { name: 'master-approval:update', description: 'Update master approval information' },
  { name: 'master-approval:delete', description: 'Delete master approvals' },
  { name: 'master-approval:list', description: 'List all master approvals' },

  // Man Hour Management
  { name: 'man-hour:create', description: 'Create new man hour records' },
  { name: 'man-hour:read', description: 'View man hour information' },
  { name: 'man-hour:update', description: 'Update man hour information' },
  { name: 'man-hour:delete', description: 'Delete man hour records' },
  { name: 'man-hour:list', description: 'List all man hour records' },

  // Waste Management
  { name: 'waste-management:create', description: 'Create new waste management records' },
  { name: 'waste-management:read', description: 'View waste management information' },
  { name: 'waste-management:update', description: 'Update waste management information' },
  { name: 'waste-management:delete', description: 'Delete waste management records' },
  { name: 'waste-management:list', description: 'List all waste management records' },

  // Room Management
  { name: 'room:create', description: 'Create new rooms' },
  { name: 'room:read', description: 'View room information' },
  { name: 'room:update', description: 'Update room information' },
  { name: 'room:delete', description: 'Delete rooms' },
  { name: 'room:list', description: 'List all rooms' },

  // Risk Management
  { name: 'risk:create', description: 'Create new risks' },
  { name: 'risk:read', description: 'View risk information' },
  { name: 'risk:update', description: 'Update risk information' },
  { name: 'risk:delete', description: 'Delete risks' },
  { name: 'risk:list', description: 'List all risks' },

  // Risk Mitigation Management
  { name: 'risk-mitigation:create', description: 'Create new risk mitigations' },
  { name: 'risk-mitigation:read', description: 'View risk mitigation information' },
  { name: 'risk-mitigation:update', description: 'Update risk mitigation information' },
  { name: 'risk-mitigation:delete', description: 'Delete risk mitigations' },
  { name: 'risk-mitigation:list', description: 'List all risk mitigations' },

  // Risk Matrix Management
  { name: 'risk-matrix:create', description: 'Create new risk matrix entries' },
  { name: 'risk-matrix:read', description: 'View risk matrix information' },
  { name: 'risk-matrix:update', description: 'Update risk matrix information' },
  { name: 'risk-matrix:delete', description: 'Delete risk matrix entries' },
  { name: 'risk-matrix:list', description: 'List all risk matrix entries' },

  // Risk Category Management
  { name: 'risk-category:create', description: 'Create new risk categories' },
  { name: 'risk-category:read', description: 'View risk category information' },
  { name: 'risk-category:update', description: 'Update risk category information' },
  { name: 'risk-category:delete', description: 'Delete risk categories' },
  { name: 'risk-category:list', description: 'List all risk categories' },

  // Reminder Management
  { name: 'reminder:create', description: 'Create new reminders' },
  { name: 'reminder:read', description: 'View reminder information' },
  { name: 'reminder:update', description: 'Update reminder information' },
  { name: 'reminder:delete', description: 'Delete reminders' },
  { name: 'reminder:list', description: 'List all reminders' },

  // PPE Management
  { name: 'ppe:create', description: 'Create new PPE records' },
  { name: 'ppe:read', description: 'View PPE information' },
  { name: 'ppe:update', description: 'Update PPE information' },
  { name: 'ppe:delete', description: 'Delete PPE records' },
  { name: 'ppe:list', description: 'List all PPE records' },

  // Environmental Measurement Management
  { name: 'environmental-measurement:create', description: 'Create new environmental measurements' },
  { name: 'environmental-measurement:read', description: 'View environmental measurement information' },
  { name: 'environmental-measurement:update', description: 'Update environmental measurement information' },
  { name: 'environmental-measurement:delete', description: 'Delete environmental measurements' },
  { name: 'environmental-measurement:list', description: 'List all environmental measurements' },

  // Course Management
  { name: 'course:create', description: 'Create new courses' },
  { name: 'course:read', description: 'View course information' },
  { name: 'course:update', description: 'Update course information' },
  { name: 'course:delete', description: 'Delete courses' },
  { name: 'course:list', description: 'List all courses' },

  // Chapter Management
  { name: 'chapter:create', description: 'Create new chapters' },
  { name: 'chapter:read', description: 'View chapter information' },
  { name: 'chapter:update', description: 'Update chapter information' },
  { name: 'chapter:delete', description: 'Delete chapters' },
  { name: 'chapter:list', description: 'List all chapters' },

  // Upload Management
  { name: 'upload:create', description: 'Create new uploads' },
  { name: 'upload:read', description: 'View upload information' },
  { name: 'upload:update', description: 'Update upload information' },
  { name: 'upload:delete', description: 'Delete uploads' },
  { name: 'upload:list', description: 'List all uploads' },

  // Audit Result Management
  { name: 'audit-result:create', description: 'Create new audit results' },
  { name: 'audit-result:read', description: 'View audit result information' },
  { name: 'audit-result:update', description: 'Update audit result information' },
  { name: 'audit-result:delete', description: 'Delete audit results' },
  { name: 'audit-result:list', description: 'List all audit results' },

  // Audit Criteria Management
  { name: 'audit-criteria:create', description: 'Create new audit criteria' },
  { name: 'audit-criteria:read', description: 'View audit criteria information' },
  { name: 'audit-criteria:update', description: 'Update audit criteria information' },
  { name: 'audit-criteria:delete', description: 'Delete audit criteria' },
  { name: 'audit-criteria:list', description: 'List all audit criteria' },

  // Certificate Category Management
  { name: 'certificate-category:create', description: 'Create new certificate categories' },
  { name: 'certificate-category:read', description: 'View certificate category information' },
  { name: 'certificate-category:update', description: 'Update certificate category information' },
  { name: 'certificate-category:delete', description: 'Delete certificate categories' },
  { name: 'certificate-category:list', description: 'List all certificate categories' },

  // Safety Equipment Management
  { name: 'safety-equipment:create', description: 'Create new safety equipment' },
  { name: 'safety-equipment:read', description: 'View safety equipment information' },
  { name: 'safety-equipment:update', description: 'Update safety equipment information' },
  { name: 'safety-equipment:delete', description: 'Delete safety equipment' },
  { name: 'safety-equipment:list', description: 'List all safety equipment' },

  // Safety Equipment Type Management
  { name: 'safety-equipment-type:create', description: 'Create new safety equipment types' },
  { name: 'safety-equipment-type:read', description: 'View safety equipment type information' },
  { name: 'safety-equipment-type:update', description: 'Update safety equipment type information' },
  { name: 'safety-equipment-type:delete', description: 'Delete safety equipment types' },
  { name: 'safety-equipment-type:list', description: 'List all safety equipment types' },

  // KPI HSE Target Management
  { name: 'kpi-hse-target:create', description: 'Create new HSE targets' },
  { name: 'kpi-hse-target:read', description: 'View HSE target information' },
  { name: 'kpi-hse-target:update', description: 'Update HSE targets' },
  { name: 'kpi-hse-target:delete', description: 'Delete HSE targets' },
  { name: 'kpi-hse-target:list', description: 'List all HSE targets' },

  // Mail Template Management
  { name: 'mail-template:create', description: 'Create new mail templates' },
  { name: 'mail-template:read', description: 'View mail template information' },
  { name: 'mail-template:update', description: 'Update mail template information' },
  { name: 'mail-template:delete', description: 'Delete mail templates' },
  { name: 'mail-template:list', description: 'List all mail templates' },

  // Access Log Management
  { name: 'access-log:list', description: 'View access logs' },
  { name: 'access-log:read', description: 'View single access log' },
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