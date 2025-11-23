import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { ReminderDto, ReminderLogDto } from './dto/reminder.dto';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { FindRemindersDto } from './dto/find-reminders.dto';
import { PaginatedResponse } from '../../shared/types/pagination-params';
import { Prisma } from '@prisma/client';

@Injectable()
export class RemindersService {
  // Initialize mappers in constructor
  private reminderMapper: (entity: any) => ReminderDto;
  private reminderLogMapper: (entity: any) => ReminderLogDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
  ) {
    this.reminderMapper = this.dtoMapper.createSimpleMapper(ReminderDto);
    this.reminderLogMapper = this.dtoMapper.createSimpleMapper(ReminderLogDto);
  }

  /**
   * Create a new reminder
   */
  async create(createDto: CreateReminderDto, userId: string): Promise<ReminderDto> {
    return this.errorHandler.safeExecute(async () => {
      // Validate user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      this.errorHandler.throwIfNotFoundById('User', userId, user);

      // Convert string dates to Date objects
      const remindAt = new Date(createDto.remindAt);
      const repeatUntil = createDto.repeatUntil ? new Date(createDto.repeatUntil) : undefined;

      // Validate dates
      const now = new Date();
      if (remindAt <= now) {
        throw new Error('Remind at date must be in the future');
      }

      if (repeatUntil && repeatUntil <= remindAt) {
        throw new Error('Repeat until date must be after remind at date');
      }

      const reminder = await this.prisma.reminder.create({
        data: {
          userId,
          entity: createDto.entity,
          entityId: createDto.entityId,
          message: createDto.message,
          remindAt,
          repeatType: createDto.repeatType || 'NONE',
          repeatUntil,
          status: 'PENDING',
        },
      });

      return this.reminderMapper(reminder);
    }, 'Creating reminder');
  }

  /**
   * Get all reminders with pagination and filtering
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
        entity,
        entityId,
        fromDate,
        toDate,
      } = params;

      // Ensure limit and page are numbers with proper validation
      const pageNum = Math.max(1, typeof page === 'string' ? parseInt(page, 10) || 1 : page || 1);
      const limitNum = Math.max(1, Math.min(100, typeof limit === 'string' ? parseInt(limit, 10) || 10 : limit || 10));

      // Build where clause
      const where: Prisma.ReminderWhereInput = {
        userId,
      };

      // Add status filter
      if (status) {
        where.status = status;
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
        where.OR = [
          { message: { contains: search, mode: 'insensitive' } },
          { entity: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Get total count
      const total = await this.prisma.reminder.count({ where });

      // Get paginated data
      const reminders = await this.prisma.reminder.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      });

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
   */
  async findOne(id: string, userId: string): Promise<ReminderDto> {
    return this.errorHandler.safeExecute(async () => {
      const reminder = await this.prisma.reminder.findFirst({
        where: {
          id,
          userId,
        },
      });

      this.errorHandler.throwIfNotFoundById('Reminder', id, reminder);

      return this.reminderMapper(reminder);
    }, 'Fetching reminder');
  }

  /**
   * Update a reminder
   */
  async update(id: string, userId: string, updateDto: UpdateReminderDto): Promise<ReminderDto> {
    return this.errorHandler.safeExecute(async () => {
      // Verify reminder exists and belongs to user
      const existing = await this.prisma.reminder.findFirst({
        where: {
          id,
          userId,
        },
      });

      this.errorHandler.throwIfNotFoundById('Reminder', id, existing);

      // Prepare update data
      const updateData: any = {};

      if (updateDto.entity !== undefined) updateData.entity = updateDto.entity;
      if (updateDto.entityId !== undefined) updateData.entityId = updateDto.entityId;
      if (updateDto.message !== undefined) updateData.message = updateDto.message;
      if (updateDto.remindAt !== undefined) {
        updateData.remindAt = new Date(updateDto.remindAt);
        
        // Validate future date
        if (updateData.remindAt <= new Date()) {
          throw new Error('Remind at date must be in the future');
        }
      }
      if (updateDto.repeatType !== undefined) updateData.repeatType = updateDto.repeatType;
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
   */
  async remove(id: string, userId: string): Promise<void> {
    return this.errorHandler.safeExecute(async () => {
      // Verify reminder exists and belongs to user
      const existing = await this.prisma.reminder.findFirst({
        where: {
          id,
          userId,
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
   */
  async getLogs(reminderId: string, userId: string): Promise<ReminderLogDto[]> {
    return this.errorHandler.safeExecute(async () => {
      // Verify reminder exists and belongs to user
      const reminder = await this.prisma.reminder.findFirst({
        where: {
          id: reminderId,
          userId,
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
      const updateData: any = {
        lastSentAt: new Date(),
      };

      if (!success) {
        updateData.status = 'FAILED';
      } else if (reminder.repeatType === 'NONE' || !reminder.repeatType) {
        // One-time reminder, mark as sent
        updateData.status = 'SENT';
      } else {
        // Recurring reminder, calculate next execution
        // TypeScript guard: repeatType is now guaranteed to be 'WEEKLY' or 'MONTHLY'
        if (reminder.repeatType === 'WEEKLY' || reminder.repeatType === 'MONTHLY') {
          const nextRemindAt = this.calculateNextRemindAt(
            reminder.remindAt,
            reminder.repeatType,
          );

          // Check if next execution exceeds repeatUntil
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

      await this.prisma.reminder.update({
        where: { id: reminderId },
        data: updateData,
      });
    }, 'Updating reminder after execution');
  }

  /**
   * Calculate next remind at date for recurring reminders
   */
  private calculateNextRemindAt(currentRemindAt: Date, repeatType: string): Date {
    const next = new Date(currentRemindAt);

    if (repeatType === 'WEEKLY') {
      next.setDate(next.getDate() + 7);
    } else if (repeatType === 'MONTHLY') {
      next.setMonth(next.getMonth() + 1);
    }

    return next;
  }
}

