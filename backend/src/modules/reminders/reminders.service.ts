/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { mergeRoleAndDirectPermissionNames } from '../../shared/utils/merge-user-permission-names';
import {
  ReminderDto,
  ReminderLogDto,
  ReminderRepeatTypeEnum,
  ReminderStatusEnum,
  ReminderTargetTypeEnum,
} from './dto/reminder.dto';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { FindRemindersDto } from './dto/find-reminders.dto';
import {
  ReminderOccurrenceDto,
  ReminderOccurrenceStateEnum,
} from './dto/occurrence.dto';
import { FindOccurrencesDto } from './dto/find-occurrences.dto';
import { PaginatedResponse } from '../../shared/types/pagination-params';
import { NotificationsService } from '../notifications/services/notifications.service';

/** Window we keep materialised ahead of "now" for each recurring reminder. */
const MATERIALIZE_WINDOW_DAYS = 90;

/** A FIRED occurrence past this many hours without ack/dismiss is MISSED. */
const MISSED_GRACE_HOURS = 24;

/** Permission name that lets a non-creator manage group-targeted reminders. */
const MANAGE_DEPARTMENT_PERMISSION = 'reminder:manage-department';

@Injectable()
export class RemindersService {
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

  // ----- create / find / update / remove --------------------------------------

  async create(
    createDto: CreateReminderDto,
    userId: string,
  ): Promise<ReminderDto> {
    return this.errorHandler.safeExecute(async () => {
      const creator = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      this.errorHandler.throwIfNotFoundById('User', userId, creator);

      const targetType: ReminderTargetTypeEnum =
        createDto.targetType ?? ReminderTargetTypeEnum.USER;
      const targetId: string = createDto.targetId;

      await this.validateTarget(targetType, targetId);

      const remindAt = new Date(createDto.remindAt);
      if (isNaN(remindAt.getTime())) {
        throw new Error('Invalid remindAt date');
      }

      const repeatUntil = createDto.repeatUntil
        ? new Date(createDto.repeatUntil)
        : undefined;

      if (!createDto.allowPast) {
        const bufferTime = new Date(Date.now() + 1000);
        if (remindAt <= bufferTime) {
          throw new Error(
            `Remind at date must be in the future. Provided: ${remindAt.toISOString()}, Current: ${new Date().toISOString()}`,
          );
        }
      }

      if (repeatUntil) {
        if (isNaN(repeatUntil.getTime())) {
          throw new Error('Invalid repeatUntil date');
        }
        if (repeatUntil <= remindAt) {
          throw new Error(
            `Repeat until date must be after remind at date. remindAt: ${remindAt.toISOString()}, repeatUntil: ${repeatUntil.toISOString()}`,
          );
        }
      }

      // @ts-ignore - prisma client regen pending
      const reminder = await this.prisma.reminder.create({
        data: {
          targetType,
          targetId,
          entity: createDto.entity,
          entityId: createDto.entityId,
          subjectType: createDto.subjectType,
          subjectId: createDto.subjectId,
          message: createDto.message,
          remindAt,
          // @ts-ignore
          repeatType: createDto.repeatType ?? null,
          repeatUntil,
          dayOfMonth: createDto.dayOfMonth,
          dayOfWeek: createDto.dayOfWeek,
          status: ReminderStatusEnum.PENDING,
          createdBy: userId,
        },
      });

      // Seed the calendar window with the next N occurrences.
      await this.materializeOccurrences(
        reminder.id,
        new Date(Date.now() + MATERIALIZE_WINDOW_DAYS * 24 * 60 * 60 * 1000),
      );

      return this.reminderMapper(reminder);
    }, 'Creating reminder');
  }

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
        subjectType,
        subjectId,
        fromDate,
        toDate,
      } = params;

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

      const where: any = await this.buildUserScopeWhere(userId);

      if (status) where.status = status;
      if (entity) where.entity = entity;
      if (entityId) where.entityId = entityId;
      if (subjectType) where.subjectType = subjectType;
      if (subjectId) where.subjectId = subjectId;

      if (targetType) {
        // Override default scope when caller asks for a specific target.
        where.OR = undefined;
        where.targetType = targetType;
        if (targetId) where.targetId = targetId;
      }

      if (fromDate || toDate) {
        where.remindAt = {};
        if (fromDate) where.remindAt.gte = new Date(fromDate);
        if (toDate) where.remindAt.lte = new Date(toDate);
      }

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

      const total = await this.prisma.reminder.count({ where });
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

  async findOne(id: string, userId: string): Promise<ReminderDto> {
    return this.errorHandler.safeExecute(async () => {
      const scope = await this.buildUserScopeWhere(userId);
      const reminder = await this.prisma.reminder.findFirst({
        where: { id, ...scope },
      });
      this.errorHandler.throwIfNotFoundById('Reminder', id, reminder);
      return this.reminderMapper(reminder);
    }, 'Fetching reminder');
  }

  async update(
    id: string,
    userId: string,
    updateDto: UpdateReminderDto,
  ): Promise<ReminderDto> {
    return this.errorHandler.safeExecute(async () => {
      const existing = await this.prisma.reminder.findUnique({ where: { id } });
      this.errorHandler.throwIfNotFoundById('Reminder', id, existing);

      await this.assertCanManage(existing, userId);

      if (updateDto.targetType || updateDto.targetId) {
        const targetType: ReminderTargetTypeEnum =
          updateDto.targetType ?? (existing.targetType as ReminderTargetTypeEnum);
        const targetId: string = updateDto.targetId ?? existing.targetId;
        await this.validateTarget(targetType, targetId);
      }

      const updateData: any = {};
      if (updateDto.targetType !== undefined) updateData.targetType = updateDto.targetType;
      if (updateDto.targetId !== undefined) updateData.targetId = updateDto.targetId;
      if (updateDto.entity !== undefined) updateData.entity = updateDto.entity;
      if (updateDto.entityId !== undefined) updateData.entityId = updateDto.entityId;
      if (updateDto.subjectType !== undefined) updateData.subjectType = updateDto.subjectType;
      if (updateDto.subjectId !== undefined) updateData.subjectId = updateDto.subjectId;
      if (updateDto.message !== undefined) updateData.message = updateDto.message;
      if (updateDto.dayOfMonth !== undefined) updateData.dayOfMonth = updateDto.dayOfMonth;
      if (updateDto.dayOfWeek !== undefined) updateData.dayOfWeek = updateDto.dayOfWeek;

      if (updateDto.remindAt !== undefined) {
        updateData.remindAt = new Date(updateDto.remindAt);
        if (!updateDto.allowPast) {
          const bufferTime = new Date(Date.now() + 1000);
          if (updateData.remindAt <= bufferTime) {
            throw new Error('Remind at date must be in the future');
          }
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

  async remove(id: string, userId: string): Promise<void> {
    return this.errorHandler.safeExecute(async () => {
      const existing = await this.prisma.reminder.findUnique({ where: { id } });
      this.errorHandler.throwIfNotFoundById('Reminder', id, existing);
      await this.assertCanManage(existing, userId);

      await this.prisma.$transaction([
        // @ts-ignore
        this.prisma.reminderOccurrence.updateMany({
          where: { reminderId: id, state: 'SCHEDULED' },
          data: { state: 'DISMISSED' },
        }),
        this.prisma.reminder.update({
          where: { id },
          data: { status: 'CANCELLED' as any },
        }),
      ]);
    }, 'Deleting reminder');
  }

  async getLogs(reminderId: string, userId: string): Promise<ReminderLogDto[]> {
    return this.errorHandler.safeExecute(async () => {
      const scope = await this.buildUserScopeWhere(userId);
      const reminder = await this.prisma.reminder.findFirst({
        where: { id: reminderId, ...scope },
      });
      this.errorHandler.throwIfNotFoundById('Reminder', reminderId, reminder);

      const logs = await this.prisma.reminderLog.findMany({
        where: { reminderId },
        orderBy: { executedAt: 'desc' },
      });
      return logs.map(this.reminderLogMapper);
    }, 'Fetching reminder logs');
  }

  // ----- occurrences ----------------------------------------------------------

  /**
   * Insert SCHEDULED occurrences for a reminder up to `until`.
   * Idempotent via the (reminderId, scheduledAt) unique constraint.
   * Returns the number of rows inserted.
   */
  async materializeOccurrences(reminderId: string, until: Date): Promise<number> {
    // @ts-ignore - prisma regen pending
    const reminder = await this.prisma.reminder.findUnique({
      where: { id: reminderId },
    });
    if (!reminder) return 0;
    if (
      reminder.status === ReminderStatusEnum.CANCELLED ||
      reminder.status === ReminderStatusEnum.EXPIRED
    ) {
      return 0;
    }

    const planned: Date[] = [];
    let cursor: Date = new Date(reminder.remindAt);
    const limitDate =
      reminder.repeatUntil && reminder.repeatUntil < until
        ? new Date(reminder.repeatUntil)
        : until;

    // First occurrence: always the configured remindAt (even if past — scheduler will
    // process overdue items on restart).
    planned.push(new Date(cursor));

    const repeatType = reminder.repeatType as ReminderRepeatTypeEnum | null;
    if (repeatType && repeatType !== ReminderRepeatTypeEnum.NONE) {
      // Generate forward, capping at a defensive max so a misconfigured reminder
      // (e.g. DAILY with a 10-year repeatUntil) can't spam the table in one call.
      const HARD_CAP = 400;
      while (planned.length < HARD_CAP) {
        const next = this.calculateNextOccurrence(
          cursor,
          repeatType,
          reminder.dayOfMonth,
          reminder.dayOfWeek,
        );
        if (!next || next > limitDate) break;
        planned.push(next);
        cursor = next;
      }
    }

    let inserted = 0;
    for (const scheduledAt of planned) {
      try {
        // @ts-ignore
        await this.prisma.reminderOccurrence.create({
          data: { reminderId, scheduledAt, state: 'SCHEDULED' },
        });
        inserted++;
      } catch (err: any) {
        // Unique violation = already exists, skip silently.
        if (err?.code !== 'P2002') throw err;
      }
    }
    return inserted;
  }

  /**
   * Get all due occurrences (state=SCHEDULED, scheduledAt <= now) joined with their
   * parent reminder for fan-out.
   */
  async getDueOccurrences(): Promise<any[]> {
    // @ts-ignore
    return this.prisma.reminderOccurrence.findMany({
      where: {
        state: 'SCHEDULED',
        scheduledAt: { lte: new Date() },
        reminder: { status: { not: 'CANCELLED' as any } },
      },
      include: { reminder: true },
      take: 500,
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findOccurrences(
    userId: string,
    params: FindOccurrencesDto,
  ): Promise<ReminderOccurrenceDto[]> {
    return this.errorHandler.safeExecute(async () => {
      const reminderScope = await this.buildUserScopeWhere(userId);

      const where: any = {
        scheduledAt: {
          gte: new Date(params.from),
          lte: new Date(params.to),
        },
        reminder: reminderScope,
      };

      if (params.state) where.state = params.state;
      if (params.reminderId) where.reminderId = params.reminderId;

      if (params.entity) where.reminder = { ...where.reminder, entity: params.entity };
      if (params.subjectType)
        where.reminder = { ...where.reminder, subjectType: params.subjectType };
      if (params.subjectId)
        where.reminder = { ...where.reminder, subjectId: params.subjectId };

      // @ts-ignore
      const rows = await this.prisma.reminderOccurrence.findMany({
        where,
        include: { reminder: true },
        orderBy: { scheduledAt: 'asc' },
        take: 1000,
      });

      return rows.map((r: any) => this.toOccurrenceDto(r));
    }, 'Fetching reminder occurrences');
  }

  async acknowledgeOccurrence(
    occurrenceId: string,
    userId: string,
  ): Promise<ReminderOccurrenceDto> {
    return this.errorHandler.safeExecute(async () => {
      const occ = await this.loadOccurrenceForUser(occurrenceId, userId);
      // @ts-ignore
      const updated = await this.prisma.reminderOccurrence.update({
        where: { id: occurrenceId },
        data: {
          state: 'ACKNOWLEDGED',
          acknowledgedBy: userId,
          acknowledgedAt: new Date(),
        },
        include: { reminder: true },
      });
      void occ;
      return this.toOccurrenceDto(updated);
    }, 'Acknowledging occurrence');
  }

  async dismissOccurrence(
    occurrenceId: string,
    userId: string,
  ): Promise<ReminderOccurrenceDto> {
    return this.errorHandler.safeExecute(async () => {
      const occ = await this.loadOccurrenceForUser(occurrenceId, userId);
      // @ts-ignore
      const updated = await this.prisma.reminderOccurrence.update({
        where: { id: occurrenceId },
        data: {
          state: 'DISMISSED',
          dismissedBy: userId,
          dismissedAt: new Date(),
        },
        include: { reminder: true },
      });
      void occ;
      return this.toOccurrenceDto(updated);
    }, 'Dismissing occurrence');
  }

  /**
   * Flip FIRED occurrences past the grace window without ack/dismiss to MISSED.
   * Returns the count flipped. Called from the scheduler.
   */
  async sweepMissed(): Promise<number> {
    const cutoff = new Date(Date.now() - MISSED_GRACE_HOURS * 60 * 60 * 1000);
    // @ts-ignore
    const result = await this.prisma.reminderOccurrence.updateMany({
      where: {
        state: 'FIRED',
        firedAt: { lt: cutoff },
        acknowledgedAt: null,
        dismissedAt: null,
      },
      data: { state: 'MISSED' },
    });
    return result.count;
  }

  /**
   * Mark an occurrence as fired (scheduler-only). Returns the occurrence so the
   * scheduler can write the matching ReminderLog.
   */
  async markOccurrenceFired(
    occurrenceId: string,
    notificationId: string | undefined,
  ): Promise<void> {
    // @ts-ignore
    await this.prisma.reminderOccurrence.update({
      where: { id: occurrenceId },
      data: {
        state: 'FIRED',
        firedAt: new Date(),
        notificationId: notificationId ?? null,
      },
    });
  }

  async markOccurrenceFailed(
    occurrenceId: string,
    reason: string,
  ): Promise<void> {
    // @ts-ignore
    await this.prisma.reminderOccurrence.update({
      where: { id: occurrenceId },
      data: { state: 'FAILED', failureReason: reason, firedAt: new Date() },
    });
  }

  // ----- private helpers ------------------------------------------------------

  /**
   * Build the WHERE clause that scopes reminder rows to a given user:
   *   created by them OR targeted at them (directly / via role / dept / office).
   */
  private async buildUserScopeWhere(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { roleId: true, departmentId: true, officeId: true },
    });

    return {
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
    };
  }

  /**
   * A user can manage a reminder if they created it OR (for group-targeted reminders)
   * they hold the reminder:manage-department permission.
   */
  private async assertCanManage(reminder: any, userId: string): Promise<void> {
    if (reminder.createdBy === userId) return;

    if (reminder.targetType === ReminderTargetTypeEnum.USER) {
      throw new ForbiddenException('Only the creator can manage this reminder');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        permissions: true,
        role: { include: { permissions: true } },
      },
    });
    const names = mergeRoleAndDirectPermissionNames(
      user?.role?.permissions,
      user?.permissions as any,
    );
    if (!names.includes(MANAGE_DEPARTMENT_PERMISSION)) {
      throw new ForbiddenException(
        'You need the reminder:manage-department permission to manage this reminder',
      );
    }
  }

  private async loadOccurrenceForUser(occurrenceId: string, userId: string) {
    const scope = await this.buildUserScopeWhere(userId);
    // @ts-ignore
    const occ = await this.prisma.reminderOccurrence.findFirst({
      where: { id: occurrenceId, reminder: scope },
      include: { reminder: true },
    });
    this.errorHandler.throwIfNotFoundById('ReminderOccurrence', occurrenceId, occ);
    return occ;
  }

  private toOccurrenceDto(row: any): ReminderOccurrenceDto {
    const r = row.reminder ?? {};
    return new ReminderOccurrenceDto({
      id: row.id,
      reminderId: row.reminderId,
      scheduledAt: row.scheduledAt,
      firedAt: row.firedAt ?? undefined,
      state: row.state,
      acknowledgedBy: row.acknowledgedBy ?? undefined,
      acknowledgedAt: row.acknowledgedAt ?? undefined,
      dismissedBy: row.dismissedBy ?? undefined,
      dismissedAt: row.dismissedAt ?? undefined,
      failureReason: row.failureReason ?? undefined,
      notificationId: row.notificationId ?? undefined,
      message: r.message,
      entity: r.entity ?? undefined,
      entityId: r.entityId ?? undefined,
      subjectType: r.subjectType ?? undefined,
      subjectId: r.subjectId ?? undefined,
      targetType: r.targetType,
      targetId: r.targetId,
    });
  }

  /**
   * Advance one step in a recurrence rule. Returns the next scheduledAt, or null if
   * the rule does not produce a valid next step (e.g. NONE).
   *
   * MONTHLY semantics: when dayOfMonth is set, jump to the same day next month and
   * clamp to the last day of that month if it has fewer days (Feb 30 → Feb 28/29).
   * Without dayOfMonth, falls back to setMonth+1 (legacy behaviour).
   *
   * WEEKLY semantics: +7 days. If dayOfWeek is set and the start did not land on
   * that day, the *first* occurrence is set to the nearest future matching day (handled
   * in materialise via the configured remindAt), and subsequent steps are always +7.
   */
  calculateNextOccurrence(
    currentAt: Date,
    repeatType: ReminderRepeatTypeEnum,
    dayOfMonth?: number | null,
    _dayOfWeek?: number | null,
  ): Date | null {
    if (repeatType === ReminderRepeatTypeEnum.NONE) return null;

    if (repeatType === ReminderRepeatTypeEnum.DAILY) {
      const next = new Date(currentAt);
      next.setDate(next.getDate() + 1);
      return next;
    }

    if (repeatType === ReminderRepeatTypeEnum.WEEKLY) {
      const next = new Date(currentAt);
      next.setDate(next.getDate() + 7);
      return next;
    }

    if (repeatType === ReminderRepeatTypeEnum.MONTHLY) {
      const next = new Date(currentAt);
      const targetDay = dayOfMonth ?? currentAt.getDate();

      // Move to the 1st of next month, then clamp the target day to that month's length.
      next.setDate(1);
      next.setMonth(next.getMonth() + 1);
      const daysInTarget = new Date(
        next.getFullYear(),
        next.getMonth() + 1,
        0,
      ).getDate();
      next.setDate(Math.min(targetDay, daysInTarget));

      // Preserve original H/M/S/ms.
      next.setHours(
        currentAt.getHours(),
        currentAt.getMinutes(),
        currentAt.getSeconds(),
        currentAt.getMilliseconds(),
      );
      return next;
    }

    return null;
  }

  // ----- legacy paths kept for back-compat ------------------------------------

  /**
   * @deprecated kept for any external callers; scheduler now uses getDueOccurrences.
   */
  async getDueReminders(): Promise<ReminderDto[]> {
    return this.errorHandler.safeExecute(async () => {
      const reminders = await this.prisma.reminder.findMany({
        where: {
          status: ReminderStatusEnum.PENDING,
          remindAt: { lte: new Date() },
        },
        take: 500,
      });
      return reminders.map(this.reminderMapper);
    }, 'Fetching due reminders');
  }

  /**
   * Legacy scheduler hook — still called after a successful fire to keep
   * Reminder.remindAt advancing for any consumers reading the parent row directly.
   * Will be retired in a follow-up TRD once all reads move to ReminderOccurrence.
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
      if (!reminder) throw new Error(`Reminder ${reminderId} not found`);

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

      const updateData: any = { lastSentAt: new Date() };

      if (!success) {
        updateData.status = ReminderStatusEnum.FAILED;
      } else if (
        reminder.repeatType === ReminderRepeatTypeEnum.NONE ||
        !reminder.repeatType
      ) {
        updateData.status = ReminderStatusEnum.SENT;
      } else {
        const next = this.calculateNextOccurrence(
          reminder.remindAt,
          reminder.repeatType as ReminderRepeatTypeEnum,
          (reminder as any).dayOfMonth,
          (reminder as any).dayOfWeek,
        );
        if (next && reminder.repeatUntil && next > reminder.repeatUntil) {
          updateData.status = ReminderStatusEnum.EXPIRED;
        } else if (next) {
          updateData.remindAt = next;
          updateData.status = ReminderStatusEnum.PENDING;
        } else {
          updateData.status = ReminderStatusEnum.FAILED;
        }
      }

      await this.prisma.reminder.update({
        where: { id: reminderId },
        data: updateData,
      });
    }, 'Updating reminder after execution');
  }

  async getOrCreateReminderNotificationType(): Promise<string> {
    const typeName = 'REMINDER';
    let notificationType = await this.prisma.notificationType.findFirst({
      where: { name: typeName },
    });
    if (!notificationType) {
      notificationType = await this.prisma.notificationType.create({
        data: { name: typeName, description: 'Scheduled reminder notifications' },
      });
    }
    return notificationType.id;
  }

  async triggerNotification(
    id: string,
    userId: string,
  ): Promise<{ success: boolean; message: string; notificationId?: string }> {
    return this.errorHandler.safeExecute(async () => {
      // @ts-ignore
      const reminder = await this.prisma.reminder.findFirst({
        where: { id, createdBy: userId },
      });
      this.errorHandler.throwIfNotFoundById('Reminder', id, reminder);

      const recipients = await this.getRecipients(
        reminder.targetType as ReminderTargetTypeEnum,
        reminder.targetId,
      );
      if (recipients.length === 0) {
        throw new Error(`No recipients found for reminder ${id}`);
      }

      const typeId = await this.getOrCreateReminderNotificationType();
      const roleIds: string[] = [
        ...new Set(
          recipients.map((r: any) => r.roleId).filter(Boolean) as string[],
        ),
      ];

      let notificationId: string | undefined;
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
            userId,
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

  // ----- target / recipient resolution ----------------------------------------

  private async validateTarget(
    targetType: ReminderTargetTypeEnum,
    targetId: string,
  ): Promise<void> {
    switch (targetType) {
      case ReminderTargetTypeEnum.USER: {
        const user = await this.prisma.user.findUnique({ where: { id: targetId } });
        this.errorHandler.throwIfNotFoundById('User', targetId, user);
        break;
      }
      case ReminderTargetTypeEnum.ROLE: {
        const role = await this.prisma.role.findUnique({ where: { id: targetId } });
        this.errorHandler.throwIfNotFoundById('Role', targetId, role);
        break;
      }
      case ReminderTargetTypeEnum.DEPARTMENT: {
        const dept = await this.prisma.department.findUnique({ where: { id: targetId } });
        this.errorHandler.throwIfNotFoundById('Department', targetId, dept);
        break;
      }
      case ReminderTargetTypeEnum.OFFICE: {
        const office = await this.prisma.office.findUnique({ where: { id: targetId } });
        this.errorHandler.throwIfNotFoundById('Office', targetId, office);
        break;
      }
      default:
        throw new Error(`Invalid target type: ${targetType}`);
    }
  }

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
      case ReminderTargetTypeEnum.ROLE:
        return this.prisma.user.findMany({
          where: { roleId: targetId, isActive: true },
          include: { role: true },
        });
      case ReminderTargetTypeEnum.DEPARTMENT:
        return this.prisma.user.findMany({
          where: { departmentId: targetId, isActive: true },
          include: { role: true },
        });
      case ReminderTargetTypeEnum.OFFICE:
        return this.prisma.user.findMany({
          where: { officeId: targetId, isActive: true },
          include: { role: true },
        });
      default:
        return [];
    }
  }
}
