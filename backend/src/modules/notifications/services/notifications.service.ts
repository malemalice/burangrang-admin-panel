import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';
import { NotificationDto, NotificationTypeDto, NotificationRecipientDto } from '../dto/notification.dto';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { UpdateNotificationDto } from '../dto/update-notification.dto';
import { PaginatedResponse, FindAllQueryDto } from '../../../shared/types/pagination-params';

@Injectable()
export class NotificationsService {
  // Initialize mappers in constructor
  private notificationMapper: (entity: any) => NotificationDto;
  private notificationTypeMapper: (entity: any) => NotificationTypeDto;
  private notificationRecipientMapper: (entity: any) => NotificationRecipientDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
  ) {
    this.notificationMapper = this.dtoMapper.createSimpleMapper(NotificationDto);
    this.notificationTypeMapper = this.dtoMapper.createSimpleMapper(NotificationTypeDto);
    this.notificationRecipientMapper = this.dtoMapper.createSimpleMapper(NotificationRecipientDto);
  }

  // Create notification for specific roles
  async createNotificationForRoles(
    createDto: CreateNotificationDto,
    createdBy: string,
  ): Promise<NotificationDto> {
    return this.errorHandler.safeExecute(async () => {
      const notification = await this.prisma.notification.create({
        data: {
          title: createDto.title,
          message: createDto.message,
          context: createDto.context,
          contextId: createDto.contextId,
          typeId: createDto.typeId,
          createdBy,
          recipients: {
            create: createDto.roleIds.map(roleId => ({
              roleId,
            }))
          }
        },
        include: {
          type: true,
          recipients: {
            include: {
              role: true,
              user: true
            }
          }
        }
      });

      return this.notificationMapper(notification);
    }, 'Creating notification for roles');
  }

  // Get user's notifications with pagination
  async getUserNotifications(
    userId: string,
    params: FindAllQueryDto,
  ): Promise<PaginatedResponse<NotificationDto>> {
    return this.errorHandler.safeExecute(async () => {
      const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc', isRead, context, typeId } = params;
      
      // Ensure limit and page are numbers with proper validation
      const pageNum = Math.max(1, typeof page === 'string' ? parseInt(page, 10) || 1 : page || 1);
      const limitNum = Math.max(1, Math.min(100, typeof limit === 'string' ? parseInt(limit, 10) || 10 : limit || 10));

      // Get user's role
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { roleId: true }
      });

      this.errorHandler.throwIfNotFoundById('User', userId, user);

      // Build the where clause
      let where: any = {
        isActive: true,
        recipients: {
          some: {
            roleId: user.roleId,
            OR: [
              { userId: null }, // Role-based notifications
              { userId: userId } // User-specific notifications
            ]
          }
        }
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
          { context: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Get all notifications first (we'll filter and paginate in memory)
      const allNotifications = await this.prisma.notification.findMany({
        where,
        include: {
          type: true,
          recipients: {
            where: {
              roleId: user.roleId,
              OR: [
                { userId: null },
                { userId: userId }
              ]
            },
            include: {
              role: true,
              user: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
      });

      // Map notifications and set isRead based on recipient's read status
      let mappedNotifications = allNotifications.map(notification => {
        const recipient = notification.recipients?.[0]; // Get the first (and should be only) recipient for this user
        return this.notificationMapper({
          ...notification,
          isRead: recipient?.isRead || false, // Use recipient's read status
          readAt: recipient?.readAt || null,
        });
      });

      // Apply isRead filter if specified
      if (isRead !== undefined && isRead !== null) {
        mappedNotifications = mappedNotifications.filter(notification => notification.isRead === isRead);
      }

      // Apply pagination after filtering
      const total = mappedNotifications.length;
      const paginatedNotifications = mappedNotifications.slice(
        (pageNum - 1) * limitNum,
        pageNum * limitNum
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
      // Get user's role
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { roleId: true }
      });

      this.errorHandler.throwIfNotFoundById('User', userId, user);

      const notification = await this.prisma.notification.findFirst({
        where: {
          id,
          isActive: true,
          recipients: {
            some: {
              roleId: user.roleId,
              OR: [
                { userId: null },
                { userId: userId }
              ]
            }
          }
        },
        include: {
          type: true,
          recipients: {
            where: {
              roleId: user.roleId,
              OR: [
                { userId: null },
                { userId: userId }
              ]
            },
            include: {
              role: true,
              user: true
            }
          }
        }
      });

      this.errorHandler.throwIfNotFoundById('Notification', id, notification);

      // Map notification and set isRead based on recipient's read status
      const recipient = notification.recipients?.[0]; // Get the first (and should be only) recipient for this user
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
      // Get user's role
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { roleId: true }
      });

      this.errorHandler.throwIfNotFoundById('User', userId, user);

      // Update the recipient record to mark as read
      await this.prisma.notificationRecipient.updateMany({
        where: {
          notificationId,
          roleId: user.roleId,
          OR: [
            { userId: null },
            { userId: userId }
          ]
        },
        data: {
          isRead: true,
          readAt: new Date(),
        }
      });

      // Check if all recipients have read the notification
      const unreadCount = await this.prisma.notificationRecipient.count({
        where: {
          notificationId,
          isRead: false
        }
      });

      // If all recipients have read it, mark the notification as read
      if (unreadCount === 0) {
        await this.prisma.notification.update({
          where: { id: notificationId },
          data: {
            isRead: true,
            readAt: new Date(),
          }
        });
      }
    }, 'Marking notification as read');
  }

  // Mark all notifications as read for user
  async markAllAsRead(userId: string): Promise<void> {
    return this.errorHandler.safeExecute(async () => {
      // Get user's role
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { roleId: true }
      });

      this.errorHandler.throwIfNotFoundById('User', userId, user);

      // Mark all recipient records as read
      await this.prisma.notificationRecipient.updateMany({
        where: {
          roleId: user.roleId,
          OR: [
            { userId: null },
            { userId: userId }
          ],
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date(),
        }
      });

      // Update all notifications that are now fully read
      const fullyReadNotifications = await this.prisma.notification.findMany({
        where: {
          isActive: true,
          isRead: false,
          recipients: {
            every: {
              isRead: true
            }
          }
        },
        select: { id: true }
      });

      if (fullyReadNotifications.length > 0) {
        await this.prisma.notification.updateMany({
          where: {
            id: {
              in: fullyReadNotifications.map(n => n.id)
            }
          },
          data: {
            isRead: true,
            readAt: new Date(),
          }
        });
      }
    }, 'Marking all notifications as read');
  }

  // Get unread count for user
  async getUnreadCount(userId: string): Promise<number> {
    return this.errorHandler.safeExecute(async () => {
      // Get user's role
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { roleId: true }
      });

      this.errorHandler.throwIfNotFoundById('User', userId, user);

      const count = await this.prisma.notificationRecipient.count({
        where: {
          roleId: user.roleId,
          OR: [
            { userId: null },
            { userId: userId }
          ],
          isRead: false
        }
      });

      return count;
    }, 'Getting unread notification count');
  }

  // Get notification types
  async getNotificationTypes(): Promise<NotificationTypeDto[]> {
    return this.errorHandler.safeExecute(async () => {
      const types = await this.prisma.notificationType.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      });

      return types.map(this.notificationTypeMapper);
    }, 'Fetching notification types');
  }

  // Update notification (admin only)
  async update(id: string, updateDto: UpdateNotificationDto): Promise<NotificationDto> {
    return this.errorHandler.safeExecute(async () => {
      const notification = await this.prisma.notification.update({
        where: { id },
        data: updateDto,
        include: {
          type: true,
          recipients: {
            include: {
              role: true,
              user: true
            }
          }
        }
      });

      return this.notificationMapper(notification);
    }, 'Updating notification');
  }

  // Delete notification (admin only)
  async remove(id: string): Promise<void> {
    return this.errorHandler.safeExecute(async () => {
      await this.prisma.notification.update({
        where: { id },
        data: { isActive: false }
      });
    }, 'Deleting notification');
  }
}
