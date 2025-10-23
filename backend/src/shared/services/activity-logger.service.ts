import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorHandlingService } from './error-handling.service';

@Injectable()
export class ActivityLoggerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
  ) {}

  /**
   * Log activity and create notification for specific roles
   */
  async logActivity(
    context: string,
    contextId: string | null,
    message: string,
    roleIds: string[],
    createdBy: string,
    notificationType: string = 'general_activity',
  ): Promise<void> {
    return this.errorHandler.safeExecute(async () => {
      // Get notification type
      const type = await this.prisma.notificationType.findUnique({
        where: { name: notificationType },
      });

      if (!type) {
        console.warn(`Notification type '${notificationType}' not found, using 'general_activity'`);
        const generalType = await this.prisma.notificationType.findUnique({
          where: { name: 'general_activity' },
        });
        
        if (!generalType) {
          console.error('General activity notification type not found');
          return;
        }
      }

      // Get the notification type ID
      let typeId = type?.id;
      if (!typeId) {
        const generalType = await this.prisma.notificationType.findUnique({ 
          where: { name: 'general_activity' } 
        });
        if (!generalType) {
          console.error('General activity notification type not found');
          return;
        }
        typeId = generalType.id;
      }

      // Create notification
      await this.prisma.notification.create({
        data: {
          title: `${context} Activity`,
          message,
          context,
          contextId,
          typeId,
          createdBy,
          recipients: {
            create: roleIds.map(roleId => ({
              roleId,
            }))
          }
        }
      });
    }, `Logging activity for context: ${context}`);
  }

  /**
   * Log user management activity
   */
  async logUserActivity(
    action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate',
    userData: { id: string; firstName: string; lastName: string; email: string },
    createdBy: string,
  ): Promise<void> {
    const actionMessages = {
      create: `New user ${userData.firstName} ${userData.lastName} (${userData.email}) has been created`,
      update: `User ${userData.firstName} ${userData.lastName} (${userData.email}) has been updated`,
      delete: `User ${userData.firstName} ${userData.lastName} (${userData.email}) has been deleted`,
      activate: `User ${userData.firstName} ${userData.lastName} (${userData.email}) has been activated`,
      deactivate: `User ${userData.firstName} ${userData.lastName} (${userData.email}) has been deactivated`,
    };

    // Get admin and super admin roles
    const adminRoles = await this.prisma.role.findMany({
      where: {
        name: { in: ['Administrator', 'Super Admin'] },
        isActive: true,
      },
      select: { id: true },
    });

    const roleIds = adminRoles.map(role => role.id);

    if (roleIds.length > 0) {
      await this.logActivity(
        'users',
        userData.id,
        actionMessages[action],
        roleIds,
        createdBy,
        'user_activity',
      );
    }
  }

  /**
   * Log role management activity
   */
  async logRoleActivity(
    action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate',
    roleData: { id: string; name: string },
    createdBy: string,
  ): Promise<void> {
    const actionMessages = {
      create: `New role "${roleData.name}" has been created`,
      update: `Role "${roleData.name}" has been updated`,
      delete: `Role "${roleData.name}" has been deleted`,
      activate: `Role "${roleData.name}" has been activated`,
      deactivate: `Role "${roleData.name}" has been deactivated`,
    };

    // Get super admin role
    const superAdminRole = await this.prisma.role.findFirst({
      where: {
        name: 'Super Admin',
        isActive: true,
      },
      select: { id: true },
    });

    if (superAdminRole) {
      await this.logActivity(
        'roles',
        roleData.id,
        actionMessages[action],
        [superAdminRole.id],
        createdBy,
        'role_activity',
      );
    }
  }

  /**
   * Log system activity
   */
  async logSystemActivity(
    message: string,
    context?: string,
    contextId?: string,
    createdBy?: string,
  ): Promise<void> {
    // Get all active roles for system notifications
    const roles = await this.prisma.role.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    const roleIds = roles.map(role => role.id);

    if (roleIds.length > 0) {
      await this.logActivity(
        context || 'system',
        contextId || null,
        message,
        roleIds,
        createdBy || 'system',
        'system_activity',
      );
    }
  }

  /**
   * Log approval activity
   */
  async logApprovalActivity(
    action: 'create' | 'approve' | 'reject' | 'update',
    approvalData: { id: string; entityId: string; status: string },
    createdBy: string,
  ): Promise<void> {
    const actionMessages = {
      create: `New approval request has been created for entity ${approvalData.entityId}`,
      approve: `Approval request for entity ${approvalData.entityId} has been approved`,
      reject: `Approval request for entity ${approvalData.entityId} has been rejected`,
      update: `Approval request for entity ${approvalData.entityId} has been updated to ${approvalData.status}`,
    };

    // Get admin and super admin roles
    const adminRoles = await this.prisma.role.findMany({
      where: {
        name: { in: ['Administrator', 'Super Admin'] },
        isActive: true,
      },
      select: { id: true },
    });

    const roleIds = adminRoles.map(role => role.id);

    if (roleIds.length > 0) {
      await this.logActivity(
        'approvals',
        approvalData.id,
        actionMessages[action],
        roleIds,
        createdBy,
        'approval_activity',
      );
    }
  }

  /**
   * Log office management activity
   */
  async logOfficeActivity(
    action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate',
    officeData: { id: string; name: string; code: string },
    createdBy: string,
  ): Promise<void> {
    const actionMessages = {
      create: `New office "${officeData.name}" (${officeData.code}) has been created`,
      update: `Office "${officeData.name}" (${officeData.code}) has been updated`,
      delete: `Office "${officeData.name}" (${officeData.code}) has been deleted`,
      activate: `Office "${officeData.name}" (${officeData.code}) has been activated`,
      deactivate: `Office "${officeData.name}" (${officeData.code}) has been deactivated`,
    };

    // Get admin and super admin roles
    const adminRoles = await this.prisma.role.findMany({
      where: {
        name: { in: ['Administrator', 'Super Admin'] },
        isActive: true,
      },
      select: { id: true },
    });

    const roleIds = adminRoles.map(role => role.id);

    if (roleIds.length > 0) {
      await this.logActivity(
        'offices',
        officeData.id,
        actionMessages[action],
        roleIds,
        createdBy,
        'office_activity',
      );
    }
  }

  /**
   * Log department management activity
   */
  async logDepartmentActivity(
    action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate',
    departmentData: { id: string; name: string; code: string },
    createdBy: string,
  ): Promise<void> {
    const actionMessages = {
      create: `New department "${departmentData.name}" (${departmentData.code}) has been created`,
      update: `Department "${departmentData.name}" (${departmentData.code}) has been updated`,
      delete: `Department "${departmentData.name}" (${departmentData.code}) has been deleted`,
      activate: `Department "${departmentData.name}" (${departmentData.code}) has been activated`,
      deactivate: `Department "${departmentData.name}" (${departmentData.code}) has been deactivated`,
    };

    // Get admin and super admin roles
    const adminRoles = await this.prisma.role.findMany({
      where: {
        name: { in: ['Administrator', 'Super Admin'] },
        isActive: true,
      },
      select: { id: true },
    });

    const roleIds = adminRoles.map(role => role.id);

    if (roleIds.length > 0) {
      await this.logActivity(
        'departments',
        departmentData.id,
        actionMessages[action],
        roleIds,
        createdBy,
        'department_activity',
      );
    }
  }

  /**
   * Log job position management activity
   */
  async logJobPositionActivity(
    action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate',
    jobPositionData: { id: string; name: string; code: string },
    createdBy: string,
  ): Promise<void> {
    const actionMessages = {
      create: `New job position "${jobPositionData.name}" (${jobPositionData.code}) has been created`,
      update: `Job position "${jobPositionData.name}" (${jobPositionData.code}) has been updated`,
      delete: `Job position "${jobPositionData.name}" (${jobPositionData.code}) has been deleted`,
      activate: `Job position "${jobPositionData.name}" (${jobPositionData.code}) has been activated`,
      deactivate: `Job position "${jobPositionData.name}" (${jobPositionData.code}) has been deactivated`,
    };

    // Get admin and super admin roles
    const adminRoles = await this.prisma.role.findMany({
      where: {
        name: { in: ['Administrator', 'Super Admin'] },
        isActive: true,
      },
      select: { id: true },
    });

    const roleIds = adminRoles.map(role => role.id);

    if (roleIds.length > 0) {
      await this.logActivity(
        'job_positions',
        jobPositionData.id,
        actionMessages[action],
        roleIds,
        createdBy,
        'job_position_activity',
      );
    }
  }

  /**
   * Log menu management activity
   */
  async logMenuActivity(
    action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate',
    menuData: { id: string; name: string; path?: string },
    createdBy: string,
  ): Promise<void> {
    const actionMessages = {
      create: `New menu item "${menuData.name}" has been created`,
      update: `Menu item "${menuData.name}" has been updated`,
      delete: `Menu item "${menuData.name}" has been deleted`,
      activate: `Menu item "${menuData.name}" has been activated`,
      deactivate: `Menu item "${menuData.name}" has been deactivated`,
    };

    // Get super admin role
    const superAdminRole = await this.prisma.role.findFirst({
      where: {
        name: 'Super Admin',
        isActive: true,
      },
      select: { id: true },
    });

    if (superAdminRole) {
      await this.logActivity(
        'menus',
        menuData.id,
        actionMessages[action],
        [superAdminRole.id],
        createdBy,
        'menu_activity',
      );
    }
  }

  /**
   * Log settings management activity
   */
  async logSettingsActivity(
    action: 'update',
    settingData: { key: string; value: string },
    createdBy: string,
  ): Promise<void> {
    const actionMessages = {
      update: `Setting "${settingData.key}" has been updated to "${settingData.value}"`,
    };

    // Get super admin role
    const superAdminRole = await this.prisma.role.findFirst({
      where: {
        name: 'Super Admin',
        isActive: true,
      },
      select: { id: true },
    });

    if (superAdminRole) {
      await this.logActivity(
        'settings',
        settingData.key,
        actionMessages[action],
        [superAdminRole.id],
        createdBy,
        'settings_activity',
      );
    }
  }
}
