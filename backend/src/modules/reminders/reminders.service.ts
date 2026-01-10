/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import {
  ReminderDto,
  ReminderLogDto,
  ReminderTargetTypeEnum,
} from './dto/reminder.dto';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { FindRemindersDto } from './dto/find-reminders.dto';
import { PaginatedResponse } from '../../shared/types/pagination-params';
import { NotificationsService } from '../notifications/services/notifications.service';

@Injectable()
export class RemindersService {
  // Initialize mappers in constructor
  private reminderMapper: (entity: any) => ReminderDto;
  private reminderLogMapper: (entity: any) => ReminderLogDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
    private readonly notificationsService: NotificationsService,
  ) {
    this.reminderMapper = this.dtoMapper.createSimpleMapper(ReminderDto);
    this.reminderLogMapper = this.dtoMapper.createSimpleMapper(ReminderLogDto);
  }

  /**
   * Create a new reminder
   */
  async create(
    createDto: CreateReminderDto,
    userId: string,
  ): Promise<ReminderDto> {
    return this.errorHandler.safeExecute(async () => {
      // Validate creator user exists
      const creator = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      this.errorHandler.throwIfNotFoundById('User', userId, creator);

      // Determine target type (default to USER for backward compatibility)
      const targetType: ReminderTargetTypeEnum =
        createDto.targetType ?? ReminderTargetTypeEnum.USER;
      const targetId: string = createDto.targetId;

      // Validate target based on targetType
      await this.validateTarget(targetType, targetId);

      // Convert string dates to Date objects
      const remindAt = new Date(createDto.remindAt);
      const repeatUntil = createDto.repeatUntil
        ? new Date(createDto.repeatUntil)
        : undefined;

      // Validate remindAt is a valid date
      if (isNaN(remindAt.getTime())) {
        throw new Error('Invalid remindAt date');
      }

      // Validate dates with a small buffer (1 second) to account for timing differences
      // This helps with production timezone issues and slight timing differences
      const now = new Date();
      const bufferTime = new Date(now.getTime() + 1000); // Add 1 second buffer

      if (remindAt <= bufferTime) {
        console.error(
          `[RemindersService] Validation failed: remindAt (${remindAt.toISOString()}) is not in the future. Now: ${now.toISOString()}, Buffer: ${bufferTime.toISOString()}`,
        );
        throw new Error(
          `Remind at date must be in the future. Provided: ${remindAt.toISOString()}, Current: ${now.toISOString()}`,
        );
      }

      if (repeatUntil) {
        // Validate repeatUntil is a valid date
        if (isNaN(repeatUntil.getTime())) {
          throw new Error('Invalid repeatUntil date');
        }

        if (repeatUntil <= remindAt) {
          console.error(
            `[RemindersService] Validation failed: repeatUntil (${repeatUntil.toISOString()}) must be after remindAt (${remindAt.toISOString()})`,
          );
          throw new Error(
            `Repeat until date must be after remind at date. remindAt: ${remindAt.toISOString()}, repeatUntil: ${repeatUntil.toISOString()}`,
          );
        }
      }

      console.log(
        `[RemindersService] Creating reminder: createdBy=${userId}, targetType=${targetType}, targetId=${targetId}, entity=${createDto.entity}, entityId=${createDto.entityId}, remindAt=${remindAt.toISOString()}, repeatUntil=${repeatUntil?.toISOString() || 'null'}`,
      );

      // @ts-ignore - Prisma types will be updated after running npx prisma generate
      const reminder = await this.prisma.reminder.create({
        data: {
          targetType,
          targetId,
          entity: createDto.entity,
          entityId: createDto.entityId,
          message: createDto.message,
          remindAt,
          // @ts-ignore - Prisma types will be updated after running npx prisma generate
          repeatType: createDto.repeatType ?? null,
          repeatUntil,
          status: 'PENDING',
          createdBy: userId,
        },
      });

      console.log(
        `[RemindersService] Successfully created reminder ${reminder.id} with targetType=${targetType}, targetId=${targetId}`,
      );

      return this.reminderMapper(reminder);
    }, 'Creating reminder');
  }

  /**
   * Validate target based on target type
   */
  private async validateTarget(
    targetType: ReminderTargetTypeEnum,
    targetId: string,
  ): Promise<void> {
    switch (targetType) {
      case ReminderTargetTypeEnum.USER: {
        const user = await this.prisma.user.findUnique({
          where: { id: targetId },
        });
        this.errorHandler.throwIfNotFoundById('User', targetId, user);
        break;
      }

      case ReminderTargetTypeEnum.ROLE: {
        const role = await this.prisma.role.findUnique({
          where: { id: targetId },
        });
        this.errorHandler.throwIfNotFoundById('Role', targetId, role);
        break;
      }

      case ReminderTargetTypeEnum.DEPARTMENT: {
        const department = await this.prisma.department.findUnique({
          where: { id: targetId },
        });
        this.errorHandler.throwIfNotFoundById(
          'Department',
          targetId,
          department,
        );
        break;
      }

      case ReminderTargetTypeEnum.OFFICE: {
        const office = await this.prisma.office.findUnique({
          where: { id: targetId },
        });
        this.errorHandler.throwIfNotFoundById('Office', targetId, office);
        break;
      }

      default:
        throw new Error(`Invalid target type: ${targetType}`);
    }
  }

  /**
   * Get recipients based on target type and target ID
   */
  private async getRecipients(
    targetType: ReminderTargetTypeEnum,
    targetId: string,
  ): Promise<any[]> {
    switch (targetType) {
      case ReminderTargetTypeEnum.USER: {
        const user = await this.prisma.user.findUnique({
          where: { id: targetId },
          include: { role: true },
        });
        return user ? [user] : [];
      }

      case ReminderTargetTypeEnum.ROLE: {
        return await this.prisma.user.findMany({
          where: {
            roleId: targetId,
            isActive: true,
          },
          include: { role: true },
        });
      }

      case ReminderTargetTypeEnum.DEPARTMENT: {
        return await this.prisma.user.findMany({
          where: {
            departmentId: targetId,
            isActive: true,
          },
          include: { role: true },
        });
      }

      case ReminderTargetTypeEnum.OFFICE: {
        return await this.prisma.user.findMany({
          where: {
            officeId: targetId,
            isActive: true,
          },
          include: { role: true },
        });
      }

      default:
        return [];
    }
  }

  /**
   * Get all reminders with pagination and filtering
   * Returns reminders created by the user or reminders where the user is a target
   */
  async findAll(
    userId: string,
    params: FindRemindersDto,
  ): Promise<PaginatedResponse<ReminderDto>> {
    return this.errorHandler.safeExecute(async () => {
      const {
        page = 1,
        limit = 10,
        sortBy = 'remindAt',
        sortOrder = 'asc',
        search,
        status,
        targetType,
        targetId,
        entity,
        entityId,
        fromDate,
        toDate,
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

      // Get user's role, department, and office for filtering
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { roleId: true, departmentId: true, officeId: true },
      });

      // Build where clause - show reminders created by user OR where user is a target
      // @ts-ignore - Prisma types will be updated after running npx prisma generate
      const where: any = {
        OR: [
          { createdBy: userId }, // Reminders created by this user
          // Reminders targeting this user
          {
            AND: [
              { targetType: ReminderTargetTypeEnum.USER },
              { targetId: userId },
            ],
          },
          // Reminders targeting user's role
          ...(user?.roleId
            ? [
                {
                  AND: [
                    { targetType: ReminderTargetTypeEnum.ROLE },
                    { targetId: user.roleId },
                  ],
                },
              ]
            : []),
          // Reminders targeting user's department
          ...(user?.departmentId
            ? [
                {
                  AND: [
                    { targetType: ReminderTargetTypeEnum.DEPARTMENT },
                    { targetId: user.departmentId },
                  ],
                },
              ]
            : []),
          // Reminders targeting user's office
          ...(user?.officeId
            ? [
                {
                  AND: [
                    { targetType: ReminderTargetTypeEnum.OFFICE },
                    { targetId: user.officeId },
                  ],
                },
              ]
            : []),
        ],
      };

      // Add status filter
      if (status) {
        where.status = status;
      }

      // Add targetType filter
      if (targetType) {
        // Override OR clause if specific target type is requested
        where.targetType = targetType;
        if (targetId) {
          where.targetId = targetId;
        }
      }

      // Add entity filter
      if (entity) {
        where.entity = entity;
      }

      // Add entityId filter
      if (entityId) {
        where.entityId = entityId;
      }

      // Add date range filters
      if (fromDate || toDate) {
        where.remindAt = {};
        if (fromDate) {
          where.remindAt.gte = new Date(fromDate);
        }
        if (toDate) {
          where.remindAt.lte = new Date(toDate);
        }
      }

      // Add search filter
      if (search) {
        where.AND = [
          ...(where.AND || []),
          {
            OR: [
              { message: { contains: search, mode: 'insensitive' } },
              { entity: { contains: search, mode: 'insensitive' } },
            ],
          },
        ];
      }

      // Debug logging for production troubleshooting
      console.log(
        `[RemindersService] Finding reminders for userId=${userId}, filters:`,
        JSON.stringify(where, null, 2),
      );

      // Get total count
      const total = await this.prisma.reminder.count({ where });

      console.log(
        `[RemindersService] Found ${total} total reminders for userId=${userId}`,
      );

      // Get paginated data
      const reminders = await this.prisma.reminder.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      });

      console.log(
        `[RemindersService] Returning ${reminders.length} reminders (page ${pageNum}, limit ${limitNum})`,
      );

      return {
        data: reminders.map(this.reminderMapper),
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      };
    }, 'Fetching reminders');
  }

  /**
   * Get a single reminder by ID
   * User can access if they created it or if they are a target
   */
  async findOne(id: string, userId: string): Promise<ReminderDto> {
    return this.errorHandler.safeExecute(async () => {
      // Get user info for target matching
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { roleId: true, departmentId: true, officeId: true },
      });

      // @ts-ignore - Prisma types will be updated after running npx prisma generate
      const reminder = await this.prisma.reminder.findFirst({
        where: {
          id,
          OR: [
            { createdBy: userId },
            {
              AND: [
                { targetType: ReminderTargetTypeEnum.USER },
                { targetId: userId },
              ],
            },
            ...(user?.roleId
              ? [
                  {
                    AND: [
                      { targetType: ReminderTargetTypeEnum.ROLE },
                      { targetId: user.roleId },
                    ],
                  },
                ]
              : []),
            ...(user?.departmentId
              ? [
                  {
                    AND: [
                      { targetType: ReminderTargetTypeEnum.DEPARTMENT },
                      { targetId: user.departmentId },
                    ],
                  },
                ]
              : []),
            ...(user?.officeId
              ? [
                  {
                    AND: [
                      { targetType: ReminderTargetTypeEnum.OFFICE },
                      { targetId: user.officeId },
                    ],
                  },
                ]
              : []),
          ],
        },
      });

      this.errorHandler.throwIfNotFoundById('Reminder', id, reminder);

      return this.reminderMapper(reminder);
    }, 'Fetching reminder');
  }

  /**
   * Update a reminder
   * Only the creator can update the reminder
   */
  async update(
    id: string,
    userId: string,
    updateDto: UpdateReminderDto,
  ): Promise<ReminderDto> {
    return this.errorHandler.safeExecute(async () => {
      // Verify reminder exists and was created by user
      const existing = await this.prisma.reminder.findFirst({
        where: {
          id,
          createdBy: userId,
        },
      });

      this.errorHandler.throwIfNotFoundById('Reminder', id, existing);

      // Validate target if targetType or targetId is being updated
      if (updateDto.targetType || updateDto.targetId) {
        // @ts-ignore - Prisma types will be updated after running npx prisma generate
        const targetType: ReminderTargetTypeEnum =
          updateDto.targetType ?? (existing.targetType as ReminderTargetTypeEnum);
        // @ts-ignore - Prisma types will be updated after running npx prisma generate
        const targetId: string = updateDto.targetId ?? existing.targetId;
        await this.validateTarget(targetType, targetId);
      }

      // Prepare update data
      // @ts-ignore - Prisma types will be updated after running npx prisma generate
      const updateData: any = {};

      if (updateDto.targetType !== undefined)
        updateData.targetType = updateDto.targetType;
      if (updateDto.targetId !== undefined) updateData.targetId = updateDto.targetId;
      if (updateDto.entity !== undefined) updateData.entity = updateDto.entity;
      if (updateDto.entityId !== undefined)
        updateData.entityId = updateDto.entityId;
      if (updateDto.message !== undefined)
        updateData.message = updateDto.message;
      if (updateDto.remindAt !== undefined) {
        updateData.remindAt = new Date(updateDto.remindAt);

        // Validate future date
        const now = new Date();
        const bufferTime = new Date(now.getTime() + 1000);
        if (updateData.remindAt <= bufferTime) {
          throw new Error('Remind at date must be in the future');
        }
      }
      if (updateDto.repeatType !== undefined)
        updateData.repeatType = updateDto.repeatType;
      if (updateDto.repeatUntil !== undefined) {
        updateData.repeatUntil = new Date(updateDto.repeatUntil);
      }
      if (updateDto.status !== undefined) updateData.status = updateDto.status;

      const reminder = await this.prisma.reminder.update({
        where: { id },
        data: updateData,
      });

      return this.reminderMapper(reminder);
    }, 'Updating reminder');
  }

  /**
   * Delete/cancel a reminder
   * Only the creator can cancel the reminder
   */
  async remove(id: string, userId: string): Promise<void> {
    return this.errorHandler.safeExecute(async () => {
      // Verify reminder exists and was created by user
      const existing = await this.prisma.reminder.findFirst({
        where: {
          id,
          createdBy: userId,
        },
      });

      this.errorHandler.throwIfNotFoundById('Reminder', id, existing);

      // Mark as cancelled instead of deleting
      await this.prisma.reminder.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });
    }, 'Deleting reminder');
  }

  /**
   * Get reminder logs for a specific reminder
   * User can access if they created it or if they are a target
   */
  async getLogs(reminderId: string, userId: string): Promise<ReminderLogDto[]> {
    return this.errorHandler.safeExecute(async () => {
      // Get user info for target matching
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { roleId: true, departmentId: true, officeId: true },
      });

      // Verify reminder exists and user has access
      // @ts-ignore - Prisma types will be updated after running npx prisma generate
      const reminder = await this.prisma.reminder.findFirst({
        where: {
          id: reminderId,
          OR: [
            { createdBy: userId },
            {
              AND: [
                { targetType: ReminderTargetTypeEnum.USER },
                { targetId: userId },
              ],
            },
            ...(user?.roleId
              ? [
                  {
                    AND: [
                      { targetType: ReminderTargetTypeEnum.ROLE },
                      { targetId: user.roleId },
                    ],
                  },
                ]
              : []),
            ...(user?.departmentId
              ? [
                  {
                    AND: [
                      { targetType: ReminderTargetTypeEnum.DEPARTMENT },
                      { targetId: user.departmentId },
                    ],
                  },
                ]
              : []),
            ...(user?.officeId
              ? [
                  {
                    AND: [
                      { targetType: ReminderTargetTypeEnum.OFFICE },
                      { targetId: user.officeId },
                    ],
                  },
                ]
              : []),
          ],
        },
      });

      this.errorHandler.throwIfNotFoundById('Reminder', reminderId, reminder);

      const logs = await this.prisma.reminderLog.findMany({
        where: { reminderId },
        orderBy: { executedAt: 'desc' },
      });

      return logs.map(this.reminderLogMapper);
    }, 'Fetching reminder logs');
  }

  /**
   * Get due reminders (used by scheduler)
   * This method is internal and should only be called by the scheduler service
   */
  async getDueReminders(): Promise<ReminderDto[]> {
    return this.errorHandler.safeExecute(async () => {
      const now = new Date();

      const reminders = await this.prisma.reminder.findMany({
        where: {
          status: 'PENDING',
          remindAt: {
            lte: now,
          },
        },
        take: 500, // Batch size limit as per requirements
      });

      return reminders.map(this.reminderMapper);
    }, 'Fetching due reminders');
  }

  /**
   * Update reminder after execution (used by scheduler)
   * This method is internal and should only be called by the scheduler service
   */
  async updateAfterExecution(
    reminderId: string,
    success: boolean,
    notificationId?: string,
    emailSent?: boolean,
    error?: string,
  ): Promise<void> {
    return this.errorHandler.safeExecute(async () => {
      const startTime = Date.now();

      // @ts-ignore - Prisma types will be updated after running npx prisma generate
      const reminder = await this.prisma.reminder.findUnique({
        where: { id: reminderId },
      });

      if (!reminder) {
        throw new Error(`Reminder ${reminderId} not found`);
      }

      // Create log entry
      await this.prisma.reminderLog.create({
        data: {
          reminderId,
          executionStatus: success ? 'SUCCESS' : 'FAILED',
          executionDuration: Date.now() - startTime,
          failureReason: error,
          notificationId,
          emailSent: emailSent || false,
          emailError: !emailSent && error ? error : undefined,
        },
      });

      // Update reminder status and next execution time
      // @ts-ignore - Prisma types will be updated after running npx prisma generate
      const updateData: any = {
        lastSentAt: new Date(),
      };

      if (!success) {
        updateData.status = 'FAILED';
        // @ts-ignore - Prisma types will be updated after running npx prisma generate
      } else if (reminder.repeatType === 'NONE' || !reminder.repeatType) {
        // One-time reminder, mark as sent
        updateData.status = 'SENT';
      } else {
        // Recurring reminder, calculate next execution
        // Check if repeatType is a valid recurring type
        const validRepeatTypes = ['DAILY', 'WEEKLY', 'MONTHLY'];
        // @ts-ignore - Prisma types will be updated after running npx prisma generate
        if (
          reminder.repeatType &&
          validRepeatTypes.includes(reminder.repeatType)
        ) {
          // @ts-ignore - Prisma types will be updated after running npx prisma generate
          const nextRemindAt = this.calculateNextRemindAt(
            reminder.remindAt,
            reminder.repeatType,
          );

          // Check if next execution exceeds repeatUntil
          // @ts-ignore - Prisma types will be updated after running npx prisma generate
          if (reminder.repeatUntil && nextRemindAt > reminder.repeatUntil) {
            updateData.status = 'EXPIRED';
          } else {
            updateData.remindAt = nextRemindAt;
            updateData.status = 'PENDING';
          }
        } else {
          // Invalid repeatType, mark as failed
          updateData.status = 'FAILED';
        }
      }

      // @ts-ignore - Prisma types will be updated after running npx prisma generate
      await this.prisma.reminder.update({
        where: { id: reminderId },
        data: updateData,
      });
    }, 'Updating reminder after execution');
  }

  /**
   * Calculate next remind at date for recurring reminders
   */
  private calculateNextRemindAt(
    currentRemindAt: Date,
    repeatType: string,
  ): Date {
    const next = new Date(currentRemindAt);

    if (repeatType === 'DAILY') {
      next.setDate(next.getDate() + 1);
    } else if (repeatType === 'WEEKLY') {
      next.setDate(next.getDate() + 7);
    } else if (repeatType === 'MONTHLY') {
      next.setMonth(next.getMonth() + 1);
    }

    return next;
  }

  /**
   * Get or create the reminder notification type
   * This is a helper method for manual trigger
   */
  async getOrCreateReminderNotificationType(): Promise<string> {
    const typeName = 'REMINDER';

    let notificationType = await this.prisma.notificationType.findFirst({
      where: { name: typeName },
    });

    if (!notificationType) {
      notificationType = await this.prisma.notificationType.create({
        data: {
          name: typeName,
          description: 'Scheduled reminder notifications',
        },
      });
    }

    return notificationType.id;
  }

  /**
   * Manually trigger a notification for a reminder
   * This creates notifications for all recipients without updating the reminder data
   * Can be triggered at any time regardless of reminder status or due date
   * Only the creator can trigger notifications
   */
  async triggerNotification(
    id: string,
    userId: string,
  ): Promise<{ success: boolean; message: string; notificationId?: string }> {
    return this.errorHandler.safeExecute(async () => {
      // Verify reminder exists and was created by user
      // @ts-ignore - Prisma types will be updated after running npx prisma generate
      const reminder = await this.prisma.reminder.findFirst({
        where: {
          id,
          createdBy: userId,
        },
      });

      this.errorHandler.throwIfNotFoundById('Reminder', id, reminder);

      // Get recipients based on target type
      // @ts-ignore - Prisma types will be updated after running npx prisma generate
      const recipients = await this.getRecipients(
        reminder.targetType as ReminderTargetTypeEnum,
        reminder.targetId,
      );

      if (recipients.length === 0) {
        throw new Error(`No recipients found for reminder ${id}`);
      }

      // Get or create notification type
      const typeId = await this.getOrCreateReminderNotificationType();

      // Create notifications for all recipients (group by role for efficiency)
      const roleIds: string[] = [
        ...new Set(
          recipients.map((r: any) => r.roleId).filter(Boolean) as string[],
        ),
      ];

      let notificationId: string | undefined;

      // Create notification for all relevant roles
      if (roleIds.length > 0) {
        const notification =
          await this.notificationsService.createNotificationForRoles(
            {
              title: 'Reminder',
              message: reminder.message,
              context: reminder.entity ?? undefined,
              contextId: reminder.entityId ?? undefined,
              typeId,
              roleIds,
            },
            userId, // Created by the current user
          );
        notificationId = notification.id;
      }

      return {
        success: true,
        message: `Notification triggered successfully for ${recipients.length} recipient(s)`,
        notificationId,
      };
    }, 'Triggering reminder notification');
  }
}
