/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';
import { CreateAuditScheduleDto } from '../dto/create-audit-schedule.dto';
import { UpdateAuditScheduleDto } from '../dto/update-audit-schedule.dto';
import { AuditScheduleDto } from '../dto/audit-schedule.dto';
import { CreateAuditItemDto } from '../dto/create-audit-item.dto';
import { AuditItemDto } from '../dto/audit-item.dto';
import { AuditResultDto } from '../dto/audit-result.dto';
import { Prisma, GeneralStatusEnum, CompliantStatusEnum } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
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
  areaIds?: string[];
  auditElementIds?: string[];
  auditorIds?: string[];
  status?: GeneralStatusEnum;
  createdAtFrom?: Date;
  createdAtTo?: Date;
}

interface FindAllAuditResultsOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  auditId?: string;
  auditElementId?: string;
  auditClauseId?: string;
  auditCriteriaId?: string;
  compliantStatus?: CompliantStatusEnum;
  status?: GeneralStatusEnum;
  search?: string;
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

  /**
   * Validates status against audit date
   * - DONE status cannot be set for dates newer than today
   * - SCHEDULED status cannot be set for dates older than today
   */
  private validateStatusAgainstDate(
    status: GeneralStatusEnum,
    auditDate: Date,
  ): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const auditDateOnly = new Date(auditDate);
    auditDateOnly.setHours(0, 0, 0, 0);

    if (status === GeneralStatusEnum.DONE && auditDateOnly > today) {
      throw new BadRequestException(
        'DONE status cannot be set for audit dates newer than today',
      );
    }

    if (status === GeneralStatusEnum.SCHEDULED && auditDateOnly < today) {
      throw new BadRequestException(
        'SCHEDULED status cannot be set for audit dates older than today',
      );
    }
  }

  /**
   * Auto-determines status based on audit date
   * - If audit date is in the past, returns DONE
   * - If audit date is today or in the future, returns SCHEDULED
   */
  private autoDetermineStatus(auditDate: Date): GeneralStatusEnum {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const auditDateOnly = new Date(auditDate);
    auditDateOnly.setHours(0, 0, 0, 0);

    if (auditDateOnly < today) {
      return GeneralStatusEnum.DONE;
    }
    return GeneralStatusEnum.SCHEDULED;
  }

  async create(
    createAuditScheduleDto: CreateAuditScheduleDto,
    userId: string,
  ): Promise<AuditScheduleDto> {
    const { areaIds, auditorIds, ...data } = createAuditScheduleDto;

    // Auto-determine status based on audit date
    // If status is provided, validate it first, then auto-determine (status always auto-changes)
    let finalStatus = data.status;
    if (finalStatus) {
      // Validate provided status against audit date
      this.validateStatusAgainstDate(finalStatus, data.auditDate);
    }
    // Always auto-determine status based on audit date (status auto-changes)
    finalStatus = this.autoDetermineStatus(data.auditDate);

    const audit = await this.prisma.audit.create({
      data: {
        ...data,
        status: finalStatus,
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
      areaIds,
      auditElementIds,
      auditorIds,
      status,
      createdAtFrom,
      createdAtTo,
    } = options || {};

    const where: Prisma.AuditWhereInput = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    if (areaIds && areaIds.length > 0) {
      where.areas = {
        some: {
          areaId: {
            in: areaIds,
          },
        },
      };
    }
    if (auditElementIds && auditElementIds.length > 0) {
      where.auditElementId = {
        in: auditElementIds,
      };
    }
    if (auditorIds && auditorIds.length > 0) {
      where.auditors = {
        some: {
          userId: {
            in: auditorIds,
          },
        },
      };
    }
    if (status) {
      where.status = status;
    }
    if (createdAtFrom || createdAtTo) {
      where.createdAt = {};
      if (createdAtFrom) {
        where.createdAt.gte = createdAtFrom;
      }
      if (createdAtTo) {
        // Set to end of day for inclusive range
        const endOfDay = new Date(createdAtTo);
        endOfDay.setHours(23, 59, 59, 999);
        where.createdAt.lte = endOfDay;
      }
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

    // Determine the audit date to use (from update or existing)
    const auditDate = data.auditDate || existingAudit.auditDate;

    // Auto-determine status based on audit date
    let finalStatus = data.status;
    if (data.status !== undefined) {
      // If status is explicitly provided, validate it first
      this.validateStatusAgainstDate(data.status, auditDate);
      // Then auto-update based on audit date (status is auto-changed)
      finalStatus = this.autoDetermineStatus(auditDate);
    } else if (data.auditDate) {
      // If only audit date is changed, auto-update status
      finalStatus = this.autoDetermineStatus(auditDate);
    } else {
      // No status or date change, keep existing status but re-validate based on current date
      // This handles the case where the audit date might be in the past now
      finalStatus = this.autoDetermineStatus(auditDate);
    }

    // Track status and date changes for reminder management (use finalStatus for newStatus)
    const oldStatus = existingAudit.status;
    const newStatus = finalStatus;
    const statusChangedToScheduled =
      oldStatus !== GeneralStatusEnum.SCHEDULED &&
      newStatus === GeneralStatusEnum.SCHEDULED;
    const statusChangedFromScheduled =
      oldStatus === GeneralStatusEnum.SCHEDULED &&
      newStatus !== GeneralStatusEnum.SCHEDULED;
    const auditDateChanged =
      data.auditDate &&
      data.auditDate.getTime() !== existingAudit.auditDate.getTime();

    // Update the audit and its related data
    const audit = await this.prisma.audit.update({
      where: { id },
      data: {
        ...data,
        status: finalStatus,
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

  async createAuditItem(
    auditId: string,
    createAuditItemDto: CreateAuditItemDto,
  ): Promise<AuditItemDto> {
    // Verify audit exists
    const audit = await this.prisma.audit.findUnique({
      where: { id: auditId },
    });
    this.errorHandler.throwIfNotFoundById('Audit', auditId, audit);

    const {
      departmentIds,
      userIds,
      images,
      ...itemData
    } = createAuditItemDto;

    // Create audit item with relations
    const auditItem = await this.prisma.auditItem.create({
      data: {
        ...itemData,
        auditId,
        dueDate: new Date(itemData.dueDate),
        status: GeneralStatusEnum.OPEN,
        ...(departmentIds && departmentIds.length > 0 && {
          departments: {
            create: departmentIds.map((departmentId) => ({
              departmentId,
            })),
          },
        }),
        ...(userIds && userIds.length > 0 && {
          users: {
            create: userIds.map((userId) => ({
              userId,
            })),
          },
        }),
        ...(images && images.length > 0 && {
          images: {
            create: images.map((img) => ({
              imageUrl: img.imageUrl,
              caption: img.caption || null,
              order: img.order,
            })),
          },
        }),
      },
      include: {
        departments: true,
        users: true,
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return this.mapAuditItemToDto(auditItem);
  }

  async updateAuditItem(
    auditId: string,
    itemId: string,
    updateAuditItemDto: Partial<CreateAuditItemDto>,
  ): Promise<AuditItemDto> {
    // Verify audit and item exist
    const auditItem = await this.prisma.auditItem.findFirst({
      where: {
        id: itemId,
        auditId,
      },
    });
    this.errorHandler.throwIfNotFoundById(
      'Audit Item',
      itemId,
      auditItem,
    );

    const {
      departmentIds,
      userIds,
      images,
      ...itemData
    } = updateAuditItemDto;

    // Update audit item
    const updatedItem = await this.prisma.auditItem.update({
      where: { id: itemId },
      data: {
        ...itemData,
        ...(itemData.dueDate && {
          dueDate: new Date(itemData.dueDate),
        }),
        // Update departments
        ...(departmentIds !== undefined && {
          departments: {
            deleteMany: {},
            create: departmentIds.map((departmentId) => ({
              departmentId,
            })),
          },
        }),
        // Update users
        ...(userIds !== undefined && {
          users: {
            deleteMany: {},
            create: userIds.map((userId) => ({
              userId,
            })),
          },
        }),
        // Update images
        ...(images !== undefined && {
          images: {
            deleteMany: {},
            create: images.map((img) => ({
              imageUrl: img.imageUrl,
              caption: img.caption || null,
              order: img.order,
            })),
          },
        }),
      },
      include: {
        departments: true,
        users: true,
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return this.mapAuditItemToDto(updatedItem);
  }

  async getAuditItems(
    auditId: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: AuditItemDto[]; meta: any }> {
    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit;

    const [items, total] = await Promise.all([
      this.prisma.auditItem.findMany({
        where: { auditId },
        include: {
          departments: true,
          users: true,
          images: {
            orderBy: { order: 'asc' },
          },
          auditCriteria: true,
        },
        orderBy: { order: 'asc' },
        skip,
        take,
      }),
      this.prisma.auditItem.count({
        where: { auditId },
      }),
    ]);

    const data = items.map((item) => this.mapAuditItemToDto(item));

    return {
      data,
      meta: {
        total,
        page: page || 1,
        limit: limit || total,
        pageCount: limit ? Math.ceil(total / limit) : 1,
      },
    };
  }

  private mapAuditItemToDto(item: any): AuditItemDto {
    return new AuditItemDto({
      id: item.id,
      auditId: item.auditId,
      auditCriteriaId: item.auditCriteriaId,
      status: item.status,
      compliantStatus: item.compliantStatus,
      evidence: item.evidence,
      recommendation: item.recommendation,
      actionRealization: item.actionRealization,
      order: item.order,
      dueDate: item.dueDate,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      departmentIds: item.departments?.map((d: any) => d.departmentId) || [],
      userIds: item.users?.map((u: any) => u.userId) || [],
      images: item.images?.map((img: any) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        caption: img.caption,
        order: img.order,
      })) || [],
    });
  }

  async findAllAuditResults(
    options?: FindAllAuditResultsOptions,
  ): Promise<{
    data: AuditResultDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      auditId,
      auditElementId,
      auditClauseId,
      auditCriteriaId,
      compliantStatus,
      status,
      search,
    } = options || {};

    const where: Prisma.AuditItemWhereInput = {};

    if (auditId) {
      where.auditId = auditId;
    }

    if (auditElementId) {
      where.audit = {
        auditElementId,
      };
    }

    if (auditClauseId) {
      where.auditCriteria = {
        auditClauseId,
      };
    }

    if (auditCriteriaId) {
      where.auditCriteriaId = auditCriteriaId;
    }

    if (compliantStatus) {
      where.compliantStatus = compliantStatus;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        {
          audit: {
            code: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          auditCriteria: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          auditCriteria: {
            auditClause: {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
        {
          auditCriteria: {
            auditClause: {
              auditElement: {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.auditItem.findMany({
        where,
        include: {
          audit: {
            include: {
              auditElement: true,
            },
          },
          auditCriteria: {
            include: {
              auditClause: {
                include: {
                  auditElement: true,
                },
              },
            },
          },
          departments: true,
          users: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditItem.count({ where }),
    ]);

    const data = items.map((item) => this.mapAuditResultToDto(item));

    return {
      data,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  private mapAuditResultToDto(item: any): AuditResultDto {
    return new AuditResultDto({
      id: item.id,
      auditId: item.auditId,
      auditScheduleCode: item.audit?.code || '',
      auditElement: {
        id: item.auditCriteria?.auditClause?.auditElement?.id || '',
        name: item.auditCriteria?.auditClause?.auditElement?.name || '',
        code: item.auditCriteria?.auditClause?.auditElement?.code || '',
      },
      auditClause: {
        id: item.auditCriteria?.auditClause?.id || '',
        name: item.auditCriteria?.auditClause?.name || '',
        code: item.auditCriteria?.auditClause?.code || '',
      },
      auditCriteria: {
        id: item.auditCriteria?.id || '',
        name: item.auditCriteria?.name || '',
        code: item.auditCriteria?.code || '',
      },
      status: item.status,
      compliantStatus: item.compliantStatus,
      evidence: item.evidence,
      recommendation: item.recommendation,
      actionRealization: item.actionRealization,
      order: item.order,
      dueDate: item.dueDate,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      departmentIds: item.departments?.map((d: any) => d.departmentId) || [],
      userIds: item.users?.map((u: any) => u.userId) || [],
    });
  }
}
