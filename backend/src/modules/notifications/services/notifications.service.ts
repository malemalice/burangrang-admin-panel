import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';
import {
  NotificationDto,
  NotificationTypeDto,
  NotificationRecipientDto,
} from '../dto/notification.dto';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { UpdateNotificationDto } from '../dto/update-notification.dto';
import { PaginatedResponse } from '../../../shared/types/pagination-params';
import { FindNotificationsDto } from '../dto/find-notifications.dto';

@Injectable()
export class NotificationsService {
  // Initialize mappers in constructor
  private notificationMapper: (entity: any) => NotificationDto;
  private notificationTypeMapper: (entity: any) => NotificationTypeDto;
  private notificationRecipientMapper: (
    entity: any,
  ) => NotificationRecipientDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
  ) {
    this.notificationMapper =
      this.dtoMapper.createSimpleMapper(NotificationDto);
    this.notificationTypeMapper =
      this.dtoMapper.createSimpleMapper(NotificationTypeDto);
    this.notificationRecipientMapper = this.dtoMapper.createSimpleMapper(
      NotificationRecipientDto,
    );
  }

  // Helper method to build recipient where clause based on user's attributes
  private buildRecipientWhereClause(
    userRoleId: string,
    userId: string,
    userDepartmentId: string | null,
    userJobPositionId: string | null,
  ): any {
    const conditions: any[] = [
      {
        OR: [
          { userId: null }, // Role-based notifications
          { userId: userId }, // User-specific notifications
        ],
      },
    ];

    // Add department filter condition
    if (userDepartmentId !== null) {
      conditions.push({
        OR: [
          { departmentId: null }, // No department filter in recipient
          { departmentId: userDepartmentId }, // Matches user's department
        ],
      });
    } else {
      // User has no department, so only match recipients with no department filter
      conditions.push({ departmentId: null });
    }

    // Add job position filter condition
    if (userJobPositionId !== null) {
      conditions.push({
        OR: [
          { jobPositionId: null }, // No job position filter in recipient
          { jobPositionId: userJobPositionId }, // Matches user's job position
        ],
      });
    } else {
      // User has no job position, so only match recipients with no job position filter
      conditions.push({ jobPositionId: null });
    }

    return {
      roleId: userRoleId,
      AND: conditions,
    };
  }

  // Create notification for specific roles and/or users
  async createNotificationForRoles(
    createDto: CreateNotificationDto,
    createdBy: string,
  ): Promise<NotificationDto> {
    return this.errorHandler.safeExecute(async () => {
      // Build recipients array
      const recipients: any[] = [];

      // Add user-specific recipients (highest priority - individual targeting)
      if (createDto.userIds && createDto.userIds.length > 0) {
        // Get user roles for user-specific notifications
        const users = await this.prisma.user.findMany({
          where: { id: { in: createDto.userIds } },
          select: {
            id: true,
            roleId: true,
            departmentId: true,
            jobPositionId: true,
          },
        });

        users.forEach((user) => {
          recipients.push({
            roleId: user.roleId,
            userId: user.id,
            departmentId: user.departmentId || null,
            jobPositionId: user.jobPositionId || null,
          });
        });
      }

      // Handle role-based recipients with optional department and job position filters
      if (createDto.roleIds && createDto.roleIds.length > 0) {
        const hasDepartmentFilter =
          createDto.departmentIds && createDto.departmentIds.length > 0;
        const hasJobPositionFilter =
          createDto.jobPositionIds && createDto.jobPositionIds.length > 0;

        if (hasDepartmentFilter && hasJobPositionFilter) {
          // Combination: role + department + job position
          createDto.roleIds.forEach((roleId) => {
            createDto.departmentIds!.forEach((departmentId) => {
              createDto.jobPositionIds!.forEach((jobPositionId) => {
                recipients.push({
                  roleId,
                  departmentId,
                  jobPositionId,
                });
              });
            });
          });
        } else if (hasDepartmentFilter) {
          // Combination: role + department
          createDto.roleIds.forEach((roleId) => {
            createDto.departmentIds!.forEach((departmentId) => {
              recipients.push({
                roleId,
                departmentId,
              });
            });
          });
        } else if (hasJobPositionFilter) {
          // Combination: role + job position
          createDto.roleIds.forEach((roleId) => {
            createDto.jobPositionIds!.forEach((jobPositionId) => {
              recipients.push({
                roleId,
                jobPositionId,
              });
            });
          });
        } else {
          // Role only (broadcast to all users with that role)
          createDto.roleIds.forEach((roleId) => {
            recipients.push({ roleId });
          });
        }
      }

      const notification = await this.prisma.notification.create({
        data: {
          title: createDto.title,
          message: createDto.message,
          context: createDto.context,
          contextId: createDto.contextId,
          typeId: createDto.typeId,
          createdBy,
          recipients: {
            create: recipients,
          },
        },
        include: {
          type: true,
          recipients: {
            include: {
              role: true,
              user: true,
              department: true,
              jobPosition: true,
            } as any,
          },
        },
      });

      return this.notificationMapper(notification);
    }, 'Creating notification for roles');
  }

  // Create notification broadcast to users by department and job position (no role filtering)
  async createNotificationByDepartmentAndJobPosition(
    data: {
      title: string;
      message: string;
      context?: string;
      contextId?: string;
      typeId: string;
      departmentId: string;
      jobPositionId: string;
    },
    createdBy: string,
  ): Promise<NotificationDto> {
    return this.errorHandler.safeExecute(async () => {
      // Get all active users matching department and job position
      const users = await this.prisma.user.findMany({
        where: {
          departmentId: data.departmentId,
          jobPositionId: data.jobPositionId,
          isActive: true,
        },
        select: {
          id: true,
          roleId: true,
          departmentId: true,
          jobPositionId: true,
        },
      });

      // Build recipients array for each user (with their role)
      const recipients = users.map((user) => ({
        roleId: user.roleId,
        userId: user.id,
        departmentId: user.departmentId,
        jobPositionId: user.jobPositionId,
      }));

      // Create notification with recipients
      const notification = await this.prisma.notification.create({
        data: {
          title: data.title,
          message: data.message,
          context: data.context,
          contextId: data.contextId,
          typeId: data.typeId,
          createdBy,
          recipients: {
            create: recipients,
          },
        },
        include: {
          type: true,
          recipients: {
            include: {
              role: true,
              user: true,
              department: true,
              jobPosition: true,
            } as any,
          },
        },
      });

      return this.notificationMapper(notification);
    }, 'Creating notification by department and job position');
  }

  // Get user's notifications with pagination
  async getUserNotifications(
    userId: string,
    params: FindNotificationsDto,
  ): Promise<PaginatedResponse<NotificationDto>> {
    return this.errorHandler.safeExecute(async () => {
      const {
        page = 1,
        limit = 10,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        isRead,
        context,
        typeId,
      } = params;

      // Ensure limit and page are numbers with proper validation
      const pageNum = Math.max(
        1,
        typeof page === 'string' ? parseInt(page, 10) || 1 : page || 1,
      );
      const limitNum = Math.max(
        1,
        Math.min(
          100,
          typeof limit === 'string' ? parseInt(limit, 10) || 10 : limit || 10,
        ),
      );

      // Get user's role, department, and job position
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          roleId: true,
          departmentId: true,
          jobPositionId: true,
        },
      });

      this.errorHandler.throwIfNotFoundById('User', userId, user);

      // Build the where clause for recipients
      const recipientWhere = this.buildRecipientWhereClause(
        user.roleId,
        userId,
        user.departmentId,
        user.jobPositionId,
      ) as any;

      // Build the where clause
      const where: any = {
        isActive: true,
        recipients: {
          some: recipientWhere,
        },
      };

      // Note: isRead filtering is handled after fetching the data
      // because we need to check the recipient's isRead status, not the notification's isRead status

      // Add context filter
      if (context) {
        where.context = context;
      }

      // Add typeId filter
      if (typeId) {
        where.typeId = typeId;
      }

      // Add search filter
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { message: { contains: search, mode: 'insensitive' } },
          { context: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Get all notifications first (we'll filter and paginate in memory)
      const allNotifications = (await this.prisma.notification.findMany({
        where,
        include: {
          type: true,
          recipients: {
            where: recipientWhere,
            include: {
              role: true,
              user: true,
              department: true,
              jobPosition: true,
            },
          } as any,
        } as any,
        orderBy: { [sortBy]: sortOrder },
      })) as any[];

      // Map notifications and set isRead based on recipient's read status
      let mappedNotifications = allNotifications.map((notification: any) => {
        const recipient = notification.recipients?.[0]; // Get the first (and should be only) recipient for this user
        return this.notificationMapper({
          ...notification,
          isRead: recipient?.isRead || false, // Use recipient's read status
          readAt: recipient?.readAt || null,
        });
      });

      // Apply isRead filter if specified
      if (isRead !== undefined && isRead !== null) {
        mappedNotifications = mappedNotifications.filter(
          (notification) => notification.isRead === isRead,
        );
      }

      // Apply pagination after filtering
      const total = mappedNotifications.length;
      const paginatedNotifications = mappedNotifications.slice(
        (pageNum - 1) * limitNum,
        pageNum * limitNum,
      );

      return {
        data: paginatedNotifications,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      };
    }, 'Fetching user notifications');
  }

  // Get notification by ID
  async findOne(id: string, userId: string): Promise<NotificationDto> {
    return this.errorHandler.safeExecute(async () => {
      // Get user's role, department, and job position
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          roleId: true,
          departmentId: true,
          jobPositionId: true,
        },
      });

      this.errorHandler.throwIfNotFoundById('User', userId, user);

      const recipientWhere = this.buildRecipientWhereClause(
        user.roleId,
        userId,
        user.departmentId,
        user.jobPositionId,
      ) as any;

      const notification = (await this.prisma.notification.findFirst({
        where: {
          id,
          isActive: true,
          recipients: {
            some: recipientWhere,
          },
        },
        include: {
          type: true,
          recipients: {
            where: recipientWhere,
            include: {
              role: true,
              user: true,
              department: true,
              jobPosition: true,
            },
          } as any,
        } as any,
      })) as any;

      this.errorHandler.throwIfNotFoundById('Notification', id, notification);

      // Map notification and set isRead based on recipient's read status
      const recipient = notification?.recipients?.[0]; // Get the first (and should be only) recipient for this user
      return this.notificationMapper({
        ...notification,
        isRead: recipient?.isRead || false, // Use recipient's read status
        readAt: recipient?.readAt || null,
      });
    }, 'Fetching notification by ID');
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    return this.errorHandler.safeExecute(async () => {
      // Get user's role, department, and job position
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          roleId: true,
          departmentId: true,
          jobPositionId: true,
        },
      });

      this.errorHandler.throwIfNotFoundById('User', userId, user);

      const recipientWhere = this.buildRecipientWhereClause(
        user.roleId,
        userId,
        user.departmentId,
        user.jobPositionId,
      ) as any;

      // Update the recipient record to mark as read
      await this.prisma.notificationRecipient.updateMany({
        where: {
          notificationId,
          ...recipientWhere,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      // Check if all recipients have read the notification
      const unreadCount = await this.prisma.notificationRecipient.count({
        where: {
          notificationId,
          isRead: false,
        },
      });

      // If all recipients have read it, mark the notification as read
      if (unreadCount === 0) {
        await this.prisma.notification.update({
          where: { id: notificationId },
          data: {
            isRead: true,
            readAt: new Date(),
          },
        });
      }
    }, 'Marking notification as read');
  }

  // Mark all notifications as read for user
  async markAllAsRead(userId: string): Promise<void> {
    return this.errorHandler.safeExecute(async () => {
      // Get user's role, department, and job position
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          roleId: true,
          departmentId: true,
          jobPositionId: true,
        },
      });

      this.errorHandler.throwIfNotFoundById('User', userId, user);

      const recipientWhere = this.buildRecipientWhereClause(
        user.roleId,
        userId,
        user.departmentId,
        user.jobPositionId,
      ) as any;

      // Mark all recipient records as read
      await this.prisma.notificationRecipient.updateMany({
        where: {
          ...recipientWhere,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      // Update all notifications that are now fully read
      const fullyReadNotifications = await this.prisma.notification.findMany({
        where: {
          isActive: true,
          isRead: false,
          recipients: {
            every: {
              isRead: true,
            },
          },
        },
        select: { id: true },
      });

      if (fullyReadNotifications.length > 0) {
        await this.prisma.notification.updateMany({
          where: {
            id: {
              in: fullyReadNotifications.map((n) => n.id),
            },
          },
          data: {
            isRead: true,
            readAt: new Date(),
          },
        });
      }
    }, 'Marking all notifications as read');
  }

  // Get unread count for user
  async getUnreadCount(userId: string): Promise<number> {
    return this.errorHandler.safeExecute(async () => {
      // Get user's role, department, and job position
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          roleId: true,
          departmentId: true,
          jobPositionId: true,
        },
      });

      this.errorHandler.throwIfNotFoundById('User', userId, user);

      const recipientWhere = this.buildRecipientWhereClause(
        user.roleId,
        userId,
        user.departmentId,
        user.jobPositionId,
      ) as any;

      const count = await this.prisma.notificationRecipient.count({
        where: {
          ...recipientWhere,
          isRead: false,
        },
      });

      return count;
    }, 'Getting unread notification count');
  }

  // Get notification types
  async getNotificationTypes(): Promise<NotificationTypeDto[]> {
    return this.errorHandler.safeExecute(async () => {
      const types = await this.prisma.notificationType.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });

      return types.map(this.notificationTypeMapper);
    }, 'Fetching notification types');
  }

  // Update notification (admin only)
  async update(
    id: string,
    updateDto: UpdateNotificationDto,
  ): Promise<NotificationDto> {
    return this.errorHandler.safeExecute(async () => {
      const notification = await this.prisma.notification.update({
        where: { id },
        data: updateDto,
        include: {
          type: true,
          recipients: {
            include: {
              role: true,
              user: true,
            },
          },
        },
      });

      return this.notificationMapper(notification);
    }, 'Updating notification');
  }

  // Delete notification (admin only)
  async remove(id: string): Promise<void> {
    return this.errorHandler.safeExecute(async () => {
      await this.prisma.notification.update({
        where: { id },
        data: { isActive: false },
      });
    }, 'Deleting notification');
  }
}
