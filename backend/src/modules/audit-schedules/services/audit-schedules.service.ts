/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';
import { CreateAuditScheduleDto } from '../dto/create-audit-schedule.dto';
import { UpdateAuditScheduleDto } from '../dto/update-audit-schedule.dto';
import { AuditScheduleDto } from '../dto/audit-schedule.dto';
import { Prisma, GeneralStatusEnum } from '@prisma/client';
import { RemindersService } from '../../reminders/reminders.service';
import {
  ReminderRepeatTypeEnum,
  ReminderTargetTypeEnum,
} from '../../reminders/dto/reminder.dto';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  areaId?: string;
  auditElementId?: string;
  status?: GeneralStatusEnum;
}

@Injectable()
export class AuditSchedulesService {
  private auditScheduleMapper: (entity: any) => AuditScheduleDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
    private readonly remindersService: RemindersService,
  ) {
    // Initialize audit schedule mapper with nested relations
    this.auditScheduleMapper = this.dtoMapper.createRelationMapper(
      AuditScheduleDto,
      {
        areas: {
          mapper: (area: any) => area.area || area,
          isArray: true,
        },
        auditElement: {
          mapper: (auditElement: any) => auditElement,
          isArray: false,
        },
        creator: {
          mapper: (creator: any) => creator,
          isArray: false,
        },
        auditors: {
          mapper: (auditor: any) => auditor.user || auditor,
          isArray: true,
        },
      },
    );
  }

  async create(
    createAuditScheduleDto: CreateAuditScheduleDto,
    userId: string,
  ): Promise<AuditScheduleDto> {
    const { areaIds, auditorIds, ...data } = createAuditScheduleDto;

    const audit = await this.prisma.audit.create({
      data: {
        ...data,
        createdBy: userId,
        ...(areaIds && areaIds.length > 0 && {
          areas: {
            create: areaIds.map((areaId) => ({
              areaId,
            })),
          },
        }),
        ...(auditorIds && auditorIds.length > 0 && {
          auditors: {
            create: auditorIds.map((auditorId) => ({
              userId: auditorId,
            })),
          },
        }),
      },
      include: {
        areas: {
          include: {
            area: true,
          },
        },
        auditElement: true,
        creator: true,
        auditors: {
          include: {
            user: true,
          },
        },
        items: true,
      },
    });

    // Create reminder if status is SCHEDULED
    if (audit.status === GeneralStatusEnum.SCHEDULED) {
      const reminderUserId = userId; // Use creator as reminder recipient
      await this.createReminderForAudit(
        audit.id,
        audit.auditDate,
        reminderUserId,
        audit.code,
      );
    }

    const mapped = this.auditScheduleMapper(audit);
    // Transform areas to areaIds and flatten auditors
    return {
      ...mapped,
      areaIds: audit.areas.map((aa: any) => aa.area.id),
      auditors: audit.auditors.map((au: any) => au.user),
    };
  }

  async findAll(options?: FindAllOptions): Promise<{
    data: AuditScheduleDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'code',
      sortOrder = 'asc',
      isActive,
      areaId,
      auditElementId,
      status,
    } = options || {};

    const where: Prisma.AuditWhereInput = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    if (areaId) {
      where.areas = {
        some: {
          areaId: areaId,
        },
      };
    }
    if (auditElementId) {
      where.auditElementId = auditElementId;
    }
    if (status) {
      where.status = status;
    }

    const [audits, total] = await Promise.all([
      this.prisma.audit.findMany({
        where,
        include: {
          areas: {
            include: {
              area: true,
            },
          },
          auditElement: true,
          creator: true,
          auditors: {
            include: {
              user: true,
            },
            orderBy: { createdAt: 'asc' },
          },
          items: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.audit.count({ where }),
    ]);

    return {
      data: audits.map((audit) => {
        const mapped = this.auditScheduleMapper(audit);
        return {
          ...mapped,
          areaIds: audit.areas.map((aa: any) => aa.area.id),
          auditors: audit.auditors.map((au: any) => au.user),
        };
      }),
      meta: { total, page, limit },
    };
  }

  async findOne(id: string): Promise<AuditScheduleDto> {
    const audit = await this.prisma.audit.findUnique({
      where: { id },
      include: {
        areas: {
          include: {
            area: true,
          },
        },
        auditElement: true,
        creator: true,
        auditors: {
          include: {
            user: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        items: true,
      },
    });

    this.errorHandler.throwIfNotFoundById('Audit', id, audit);

    const mapped = this.auditScheduleMapper(audit);
    // Transform areas to areaIds and flatten auditors
    return {
      ...mapped,
      areaIds: audit.areas.map((aa: any) => aa.area.id),
      auditors: audit.auditors.map((au: any) => au.user),
    };
  }

  async update(
    id: string,
    updateAuditScheduleDto: UpdateAuditScheduleDto,
  ): Promise<AuditScheduleDto> {
    const { areaIds, auditorIds, ...data } = updateAuditScheduleDto;

    // First, find the audit to update
    const existingAudit = await this.prisma.audit.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('Audit', id, existingAudit);

    // Track status and date changes for reminder management
    const oldStatus = existingAudit.status;
    const newStatus = data.status;
    const statusChangedToScheduled =
      oldStatus !== GeneralStatusEnum.SCHEDULED &&
      newStatus === GeneralStatusEnum.SCHEDULED;
    const statusChangedFromScheduled =
      oldStatus === GeneralStatusEnum.SCHEDULED &&
      newStatus !== GeneralStatusEnum.SCHEDULED &&
      newStatus !== undefined;
    const auditDateChanged =
      data.auditDate &&
      data.auditDate.getTime() !== existingAudit.auditDate.getTime();

    // Update the audit and its related data
    const audit = await this.prisma.audit.update({
      where: { id },
      data: {
        ...data,
        ...(areaIds !== undefined && {
          areas: {
            deleteMany: {},
            create: areaIds.map((areaId) => ({
              areaId,
            })),
          },
        }),
        ...(auditorIds !== undefined && {
          auditors: {
            deleteMany: {},
            create: auditorIds.map((auditorId) => ({
              userId: auditorId,
            })),
          },
        }),
      },
      include: {
        areas: {
          include: {
            area: true,
          },
        },
        auditElement: true,
        creator: true,
        auditors: {
          include: {
            user: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        items: true,
      },
    });

    // Handle reminder creation/deletion based on status changes
    if (statusChangedFromScheduled) {
      // Status changed from SCHEDULED to something else - delete reminders
      await this.deleteRemindersForAudit(id);
    } else if (statusChangedToScheduled) {
      // Status changed to SCHEDULED - create reminder
      const reminderUserId = audit.createdBy;
      await this.createReminderForAudit(
        audit.id,
        audit.auditDate,
        reminderUserId,
        audit.code,
      );
    } else if (
      audit.status === GeneralStatusEnum.SCHEDULED &&
      auditDateChanged
    ) {
      // Status is still SCHEDULED but auditDate changed - delete old and create new reminder
      await this.deleteRemindersForAudit(id);
      const reminderUserId = audit.createdBy;
      await this.createReminderForAudit(
        audit.id,
        audit.auditDate,
        reminderUserId,
        audit.code,
      );
    }

    const mapped = this.auditScheduleMapper(audit);
    // Transform areas to areaIds and flatten auditors
    return {
      ...mapped,
      areaIds: audit.areas.map((aa: any) => aa.area.id),
      auditors: audit.auditors.map((au: any) => au.user),
    };
  }

  async remove(id: string): Promise<void> {
    // First check if the audit exists
    const audit = await this.prisma.audit.findUnique({
      where: { id },
      include: {
        items: true,
        auditors: true,
      },
    });

    this.errorHandler.throwIfNotFoundById('Audit', id, audit);

    // Delete all reminders associated with this audit
    await this.deleteRemindersForAudit(id);

    // Delete all related items first (CASCADE will handle images)
    await this.prisma.auditItem.deleteMany({
      where: { auditId: id },
    });

    // Delete all related auditors
    await this.prisma.auditToUser.deleteMany({
      where: { auditId: id },
    });

    // Delete all related areas (junction table)
    await this.prisma.auditToArea.deleteMany({
      where: { auditId: id },
    });

    // Then delete the audit
    await this.prisma.audit.delete({
      where: { id },
    });
  }

  /**
   * Convert audit date to reminder time (09:00 AM GMT+7)
   */
  private convertAuditDateToReminderTime(auditDate: Date): Date {
    // Extract date components using UTC methods to avoid timezone issues
    const year = auditDate.getUTCFullYear();
    const month = auditDate.getUTCMonth();
    const day = auditDate.getUTCDate();

    // Create UTC date at 02:00 AM UTC (which is 09:00 AM GMT+7)
    return new Date(Date.UTC(year, month, day, 2, 0, 0));
  }

  /**
   * Get the first reminder date (today or tomorrow at 09:00 AM GMT+7)
   * If today's 09:00 AM GMT+7 has passed, start from tomorrow
   */
  private getFirstReminderDate(): Date {
    const now = new Date();
    const todayReminder = this.convertAuditDateToReminderTime(now);

    // If today's reminder time has passed, start from tomorrow
    if (todayReminder <= now) {
      const tomorrow = new Date(now);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      return this.convertAuditDateToReminderTime(tomorrow);
    }

    return todayReminder;
  }

  /**
   * Create reminder for audit when status is SCHEDULED
   * Reminder repeats daily from today/tomorrow until auditDate
   */
  private async createReminderForAudit(
    auditId: string,
    auditDate: Date,
    userId: string,
    code: string,
  ): Promise<void> {
    try {
      const now = new Date();
      const auditReminderTime =
        this.convertAuditDateToReminderTime(auditDate);

      // Only create reminder if auditDate reminder time is in the future
      if (auditReminderTime <= now) {
        return;
      }

      // Get the first reminder date (today or tomorrow)
      const firstReminderDate = this.getFirstReminderDate();

      // Only create if first reminder date is before or equal to auditDate
      if (firstReminderDate > auditReminderTime) {
        return;
      }

      // Set repeatUntil to auditDate at 09:00 AM GMT+7
      // This ensures the reminder fires on auditDate and stops after that
      const repeatUntil = new Date(auditReminderTime);

      await this.remindersService.create(
        {
          targetType: ReminderTargetTypeEnum.USER,
          targetId: userId,
          entity: 't_audits',
          entityId: auditId,
          message: `Audit ${code} is scheduled for ${auditDate.toLocaleDateString()}`,
          remindAt: firstReminderDate.toISOString(),
          repeatType: ReminderRepeatTypeEnum.DAILY,
          repeatUntil: repeatUntil.toISOString(),
        },
        userId,
      );
    } catch (error) {
      // Log error but don't throw to avoid breaking the main operation
      console.error(
        `Failed to create reminder for audit ${auditId}:`,
        error,
      );
    }
  }

  /**
   * Delete all reminders associated with an audit
   */
  private async deleteRemindersForAudit(
    auditId: string,
  ): Promise<void> {
    try {
      // Find all reminders for this audit
      const reminders = await this.prisma.reminder.findMany({
        where: {
          entity: 't_audits',
          entityId: auditId,
          status: 'PENDING', // Only cancel pending reminders
        },
      });

      // Cancel each reminder by updating status to CANCELLED
      for (const reminder of reminders) {
        await this.prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: 'CANCELLED' },
        });
      }
    } catch (error) {
      // Log error but don't throw to avoid breaking the main operation
      console.error(
        `Failed to delete reminders for audit ${auditId}:`,
        error,
      );
    }
  }
}
