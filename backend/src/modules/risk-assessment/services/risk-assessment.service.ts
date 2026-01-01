/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateRiskAssessmentDto } from '../dto/create-risk-assessment.dto';
import { UpdateRiskAssessmentDto } from '../dto/update-risk-assessment.dto';
import { RiskAssessmentDto } from '../dto/risk-assessment.dto';
import { CreateRiskAssessmentItemDto } from '../dto/create-risk-assessment-item.dto';
import { UpdateRiskAssessmentItemDto } from '../dto/update-risk-assessment-item.dto';
import { RiskAssessmentItemDto } from '../dto/risk-assessment-item.dto';
import {
  RiskAssessment,
  RiskAssessmentItem,
  Prisma,
  GeneralStatusEnum,
} from '@prisma/client';
import { ApprovalsService } from '../../approvals/approvals.service';
import { RemindersService } from '../../reminders/reminders.service';
import { ReminderRepeatTypeEnum } from '../../reminders/dto/reminder.dto';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  departmentId?: string;
  status?: GeneralStatusEnum;
  search?: string;
}

@Injectable()
export class RiskAssessmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly approvalsService: ApprovalsService,
    private readonly remindersService: RemindersService,
  ) {}

  async create(
    createRiskAssessmentDto: CreateRiskAssessmentDto,
    userId: string,
  ): Promise<RiskAssessmentDto> {
    const { items, createdBy, ...data } = createRiskAssessmentDto;

    try {
      const assessment = await this.prisma.riskAssessment.create({
        data: {
          ...data,
          createdBy: userId, // Use authenticated user ID from request
          ...(items && items.length > 0 && {
            items: {
              create: items, // Prisma will automatically map mRiskId to mriskid column via @map
            },
          }),
        },
        include: {
          items: {
            include: {
              mRisk: true,
              mRiskCategory: true,
            },
          },
          department: true,
          creator: true,
          assignee: true,
        },
      });

      const assessmentWithRelations = await this.prisma.riskAssessment.findUnique(
        {
          where: { id: assessment.id },
          include: {
            items: {
              include: {
                mRisk: true,
                mRiskCategory: true,
              },
            },
            department: true,
            creator: true,
            assignee: true,
          },
        },
      );

      if (!assessmentWithRelations) {
        throw new NotFoundException(
          `Risk assessment with ID ${assessment.id} not found`,
        );
      }

    // Create reminder if status is SCHEDULED
    if (assessmentWithRelations.status === GeneralStatusEnum.SCHEDULED) {
      const reminderUserId = assessmentWithRelations.assigneeId || userId;
      await this.createReminderForRiskAssessment(
        assessmentWithRelations.id,
        assessmentWithRelations.assessmentDate,
        reminderUserId,
        assessmentWithRelations.code,
      );
    }

      return this.mapToDto(assessmentWithRelations);
    } catch (error: any) {
      // Handle Prisma unique constraint error for code
      if (error.code === 'P2002' && error.meta?.target?.includes('code')) {
        throw new ConflictException('Code already exists');
      }
      throw error;
    }
  }

  async findAll(options?: FindAllOptions): Promise<{
    data: RiskAssessmentDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'code',
      sortOrder = 'asc',
      isActive,
      departmentId,
      status,
      search,
    } = options || {};

    const where: Prisma.RiskAssessmentWhereInput = {};

    // Handle search - only search if search term is not empty after trimming
    if (search) {
      const searchTerm = search.trim();
      if (searchTerm.length > 0) {
        where.OR = [
          { code: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    if (departmentId) {
      where.departmentId = departmentId;
    }
    if (status) {
      where.status = status;
    }

    const [assessments, total] = await Promise.all([
      this.prisma.riskAssessment.findMany({
        where,
        include: {
          items: {
            include: {
              mRisk: true,
              mRiskCategory: true,
            },
          },
          department: true,
          creator: true,
          assignee: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.riskAssessment.count({ where }),
    ]);

    return {
      data: assessments.map((assessment) => this.mapToDto(assessment)),
      meta: { total, page, limit },
    };
  }

  async findOne(id: string): Promise<RiskAssessmentDto> {
    const assessment = await this.prisma.riskAssessment.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            mRisk: true,
            mRiskCategory: true,
          },
        },
        department: true,
        creator: true,
        assignee: true,
      },
    });

    if (!assessment) {
      throw new NotFoundException(`Risk Assessment with ID ${id} not found`);
    }

    return this.mapToDto(assessment);
  }

  async update(
    id: string,
    updateRiskAssessmentDto: UpdateRiskAssessmentDto,
  ): Promise<RiskAssessmentDto> {
    const { items, ...data } = updateRiskAssessmentDto;

    // First, find the assessment to update
    const existingAssessment = await this.prisma.riskAssessment.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingAssessment) {
      throw new NotFoundException(`Risk Assessment with ID ${id} not found`);
    }

    // Track status change for reminder management
    const oldStatus = existingAssessment.status;
    const newStatus = data.status;
    const statusChangedToScheduled =
      oldStatus !== GeneralStatusEnum.SCHEDULED &&
      newStatus === GeneralStatusEnum.SCHEDULED;
    const statusChangedFromScheduled =
      oldStatus === GeneralStatusEnum.SCHEDULED &&
      newStatus !== GeneralStatusEnum.SCHEDULED &&
      newStatus !== undefined;
    const assessmentDateChanged =
      data.assessmentDate &&
      data.assessmentDate.getTime() !==
        existingAssessment.assessmentDate.getTime();

    // Update the assessment and its items
    const assessment = await this.prisma.riskAssessment.update({
      where: { id },
      data: {
        ...data,
        ...(items && {
          items: {
            deleteMany: {},
            create: items, // Prisma will automatically map mRiskId to mriskid column via @map
          },
        }),
      },
      include: {
        items: {
          include: {
            mRisk: true,
            mRiskCategory: true,
          },
        },
        department: true,
        creator: true,
        assignee: true,
      },
    });

    // Handle reminder creation/deletion based on status changes
    if (statusChangedFromScheduled) {
      // Status changed from SCHEDULED to something else - delete reminders
      await this.deleteRemindersForRiskAssessment(id);
    } else if (statusChangedToScheduled) {
      // Status changed to SCHEDULED - create reminder
      const reminderUserId = assessment.assigneeId || assessment.createdBy;
      await this.createReminderForRiskAssessment(
        assessment.id,
        assessment.assessmentDate,
        reminderUserId,
        assessment.code,
      );
    } else if (
      assessment.status === GeneralStatusEnum.SCHEDULED &&
      assessmentDateChanged
    ) {
      // Status is still SCHEDULED but assessmentDate changed - delete old and create new reminder
      await this.deleteRemindersForRiskAssessment(id);
      const reminderUserId = assessment.assigneeId || assessment.createdBy;
      await this.createReminderForRiskAssessment(
        assessment.id,
        assessment.assessmentDate,
        reminderUserId,
        assessment.code,
      );
    }

    return this.mapToDto(assessment);
  }

  async remove(id: string): Promise<void> {
    // First check if the assessment exists
    const assessment = await this.prisma.riskAssessment.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!assessment) {
      throw new NotFoundException(`Risk Assessment with ID ${id} not found`);
    }

    // Delete all related items first
    await this.prisma.riskAssessmentItem.deleteMany({
      where: { riskAssessmentId: id },
    });

    // Delete related reminders
    await this.deleteRemindersForRiskAssessment(id);

    // Then delete the assessment
    await this.prisma.riskAssessment.delete({
      where: { id },
    });
  }

  /**
   * Convert assessment date to reminder time (09:00 AM GMT+7 converted to UTC)
   * GMT+7 means UTC+7, so 09:00 AM GMT+7 = 02:00 AM UTC
   * Returns the date at 09:00 AM GMT+7 (02:00 AM UTC)
   */
  private convertAssessmentDateToReminderTime(assessmentDate: Date): Date {
    // Extract date components using UTC methods to avoid timezone issues
    const year = assessmentDate.getUTCFullYear();
    const month = assessmentDate.getUTCMonth();
    const day = assessmentDate.getUTCDate();

    // Create UTC date at 02:00 AM UTC (which is 09:00 AM GMT+7)
    return new Date(Date.UTC(year, month, day, 2, 0, 0));
  }

  /**
   * Get the first reminder date (today or tomorrow at 09:00 AM GMT+7)
   * If today's 09:00 AM GMT+7 has passed, start from tomorrow
   */
  private getFirstReminderDate(): Date {
    const now = new Date();
    const todayReminder = this.convertAssessmentDateToReminderTime(now);

    // If today's reminder time has passed, start from tomorrow
    if (todayReminder <= now) {
      const tomorrow = new Date(now);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      return this.convertAssessmentDateToReminderTime(tomorrow);
    }

    return todayReminder;
  }

  /**
   * Create reminder for risk assessment when status is SCHEDULED
   * Reminder repeats daily from today/tomorrow until assessmentDate
   */
  private async createReminderForRiskAssessment(
    assessmentId: string,
    assessmentDate: Date,
    userId: string,
    code: string,
  ): Promise<void> {
    try {
      const now = new Date();
      const assessmentReminderTime =
        this.convertAssessmentDateToReminderTime(assessmentDate);

      // Only create reminder if assessmentDate reminder time is in the future
      if (assessmentReminderTime <= now) {
        return;
      }

      // Get the first reminder date (today or tomorrow)
      const firstReminderDate = this.getFirstReminderDate();

      // Only create if first reminder date is before or equal to assessmentDate
      if (firstReminderDate > assessmentReminderTime) {
        return;
      }

      // Set repeatUntil to assessmentDate at 09:00 AM GMT+7
      // This ensures the reminder fires on assessmentDate and stops after that
      const repeatUntil = new Date(assessmentReminderTime);

      await this.remindersService.create(
        {
          entity: 't_risk_assessment',
          entityId: assessmentId,
          message: `Risk Assessment ${code} is scheduled for ${assessmentDate.toLocaleDateString()}`,
          remindAt: firstReminderDate.toISOString(),
          repeatType: ReminderRepeatTypeEnum.DAILY,
          repeatUntil: repeatUntil.toISOString(),
        },
        userId,
      );
    } catch (error) {
      // Log error but don't throw to avoid breaking the main operation
      console.error(
        `Failed to create reminder for risk assessment ${assessmentId}:`,
        error,
      );
    }
  }

  /**
   * Delete all reminders associated with a risk assessment
   */
  private async deleteRemindersForRiskAssessment(
    assessmentId: string,
  ): Promise<void> {
    try {
      // Find all reminders for this risk assessment
      const reminders = await this.prisma.reminder.findMany({
        where: {
          entity: 't_risk_assessment',
          entityId: assessmentId,
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
        `Failed to delete reminders for risk assessment ${assessmentId}:`,
        error,
      );
    }
  }

  private mapToDto(
    assessment: RiskAssessment & {
      items: (RiskAssessmentItem & {
        mRisk: any;
        mRiskCategory: any;
      })[];
      department: any;
      creator: any;
      assignee: any;
    },
  ): RiskAssessmentDto {
    return {
      id: assessment.id,
      code: assessment.code,
      description: assessment.description ?? undefined,
      departmentId: assessment.departmentId,
      department: assessment.department,
      assessmentDate: assessment.assessmentDate,
      createdAt: assessment.createdAt,
      updatedAt: assessment.updatedAt,
      createdBy: assessment.createdBy,
      creator: assessment.creator,
      status: assessment.status,
      isActive: assessment.isActive,
      items: assessment.items.map((item) => ({
        id: item.id,
        riskAssessmentId: item.riskAssessmentId,
        mRiskId: (item as any).mRiskId,
        mRisk: (item as any).mRisk,
        mRiskCategoryId: item.mRiskCategoryId,
        mRiskCategory: item.mRiskCategory,
        likelihoodLevel: item.likelihoodLevel,
        consequenceLevel: item.consequenceLevel,
        riskMatrixRating: item.riskMatrixRating,
        interpretation: item.interpretation,
        postLikelihoodLevel: item.postLikelihoodLevel,
        postConsequenceLevel: item.postConsequenceLevel,
        postRiskMatrixRating: item.postRiskMatrixRating,
        postInterpretation: item.postInterpretation,
      })),
      assigneeId: assessment.assigneeId ?? undefined,
      assignee: assessment.assignee,
      actionPlan: assessment.actionPlan ?? undefined,
    };
  }

  // Risk Assessment Items CRUD operations
  async createItem(
    riskAssessmentId: string,
    createItemDto: CreateRiskAssessmentItemDto,
  ): Promise<RiskAssessmentItemDto> {
    // Verify risk assessment exists
    const assessment = await this.prisma.riskAssessment.findUnique({
      where: { id: riskAssessmentId },
    });

    if (!assessment) {
      throw new NotFoundException(
        `Risk Assessment with ID ${riskAssessmentId} not found`,
      );
    }

    const item = await this.prisma.riskAssessmentItem.create({
      data: {
        ...createItemDto,
        riskAssessmentId,
      },
      include: {
        mRisk: true,
        mRiskCategory: true,
      },
    });

    return this.mapItemToDto(item);
  }

  async findAllItems(
    riskAssessmentId: string,
    options?: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      search?: string;
    },
  ): Promise<{
    data: RiskAssessmentItemDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    // Verify risk assessment exists
    const assessment = await this.prisma.riskAssessment.findUnique({
      where: { id: riskAssessmentId },
    });

    if (!assessment) {
      throw new NotFoundException(
        `Risk Assessment with ID ${riskAssessmentId} not found`,
      );
    }

    const {
      page = 1,
      limit = 10,
      sortBy = 'id',
      sortOrder = 'desc',
      search,
    } = options || {};

    // Valid sortable fields for RiskAssessmentItem
    const validSortFields = [
      'id',
      'riskAssessmentId',
      'mRiskId',
      'mRiskCategoryId',
      'likelihoodLevel',
      'consequenceLevel',
      'riskMatrixRating',
      'interpretation',
      'postLikelihoodLevel',
      'postConsequenceLevel',
      'postRiskMatrixRating',
      'postInterpretation',
    ];

    // Validate and sanitize sortBy
    const validatedSortBy = validSortFields.includes(sortBy) ? sortBy : 'id';

    const where: Prisma.RiskAssessmentItemWhereInput = {
      riskAssessmentId,
      ...(search && {
        OR: [
          {
            mRisk: {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
          {
            mRiskCategory: {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.riskAssessmentItem.findMany({
        where,
        include: {
          mRisk: true,
          mRiskCategory: true,
        },
        orderBy: {
          [validatedSortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.riskAssessmentItem.count({ where }),
    ]);

    return {
      data: items.map((item) => this.mapItemToDto(item)),
      meta: { total, page, limit },
    };
  }

  async findOneItem(
    riskAssessmentId: string,
    itemId: string,
  ): Promise<RiskAssessmentItemDto> {
    const item = await this.prisma.riskAssessmentItem.findFirst({
      where: {
        id: itemId,
        riskAssessmentId,
      },
      include: {
        mRisk: true,
        mRiskCategory: true,
      },
    });

    if (!item) {
      throw new NotFoundException(
        `Risk Assessment Item with ID ${itemId} not found`,
      );
    }

    return this.mapItemToDto(item);
  }

  async updateItem(
    riskAssessmentId: string,
    itemId: string,
    updateItemDto: UpdateRiskAssessmentItemDto,
  ): Promise<RiskAssessmentItemDto> {
    // Verify item exists and belongs to the assessment
    const existingItem = await this.prisma.riskAssessmentItem.findFirst({
      where: {
        id: itemId,
        riskAssessmentId,
      },
    });

    if (!existingItem) {
      throw new NotFoundException(
        `Risk Assessment Item with ID ${itemId} not found`,
      );
    }

    const item = await this.prisma.riskAssessmentItem.update({
      where: { id: itemId },
      data: updateItemDto,
      include: {
        mRisk: true,
        mRiskCategory: true,
      },
    });

    return this.mapItemToDto(item);
  }

  async removeItem(riskAssessmentId: string, itemId: string): Promise<void> {
    // Verify item exists and belongs to the assessment
    const item = await this.prisma.riskAssessmentItem.findFirst({
      where: {
        id: itemId,
        riskAssessmentId,
      },
    });

    if (!item) {
      throw new NotFoundException(
        `Risk Assessment Item with ID ${itemId} not found`,
      );
    }

    await this.prisma.riskAssessmentItem.delete({
      where: { id: itemId },
    });
  }

  private mapItemToDto(
    item: RiskAssessmentItem & {
      mRisk: any;
      mRiskCategory: any;
    },
  ): RiskAssessmentItemDto {
    return {
      id: item.id,
      riskAssessmentId: item.riskAssessmentId,
      mRiskId: (item as any).mRiskId,
      mRisk: (item as any).mRisk,
      mRiskCategoryId: item.mRiskCategoryId,
      mRiskCategory: item.mRiskCategory,
      likelihoodLevel: item.likelihoodLevel,
      consequenceLevel: item.consequenceLevel,
      riskMatrixRating: item.riskMatrixRating,
      interpretation: item.interpretation,
      postLikelihoodLevel: item.postLikelihoodLevel,
      postConsequenceLevel: item.postConsequenceLevel,
      postRiskMatrixRating: item.postRiskMatrixRating,
      postInterpretation: item.postInterpretation,
    };
  }
}
