/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateRiskAssessmentDto } from '../dto/create-risk-assessment.dto';
import { UpdateRiskAssessmentDto } from '../dto/update-risk-assessment.dto';
import { RiskAssessmentDto } from '../dto/risk-assessment.dto';
import { CreateRiskAssessmentItemDto } from '../dto/create-risk-assessment-item.dto';
import { UpdateRiskAssessmentItemDto } from '../dto/update-risk-assessment-item.dto';
import { RiskAssessmentItemDto } from '../dto/risk-assessment-item.dto';
import { RiskMitigationDataDto, RiskMitigationRecordDto } from '../dto/risk-mitigation-data.dto';
import {
  RiskAssessment,
  RiskAssessmentItem,
  RiskMitigationRecord,
  Prisma,
  GeneralStatusEnum,
} from '@prisma/client';
import { ApprovalsService } from '../../approvals/approvals.service';
import { MasterApprovalsService } from '../../approvals/master-approvals.service';
import { RemindersService } from '../../reminders/reminders.service';
import {
  ReminderRepeatTypeEnum,
  ReminderStatusEnum,
  ReminderTargetTypeEnum,
} from '../../reminders/dto/reminder.dto';
import { APPROVAL_ENTITIES } from '../../../shared/constants/approval-entities';
import { PRISMA_ERROR_CODES } from '../../../shared/constants/prisma-errors';
import {
  buildSoftDeleteData,
  buildSoftDeleteDataWithInactive,
  isNotDeleted,
} from '../../../shared/utils/soft-delete.util';

// Entity type constant for risk assessment items
const RISK_ASSESSMENT_ITEM_ENTITY = 'RISK_ASSESSMENT_ITEM';

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
    private readonly masterApprovalsService: MasterApprovalsService,
    private readonly remindersService: RemindersService,
  ) { }

  async create(
    createRiskAssessmentDto: CreateRiskAssessmentDto,
    userId: string,
  ): Promise<RiskAssessmentDto> {
    const { items, createdBy, ...data } = createRiskAssessmentDto;
    let createdAssessmentId: string | null = null;

    try {
      console.log(
        `[RiskAssessment] create start code=${createRiskAssessmentDto.code} status=${createRiskAssessmentDto.status} departmentId=${createRiskAssessmentDto.departmentId}`,
      );

      // Extract mitigations from items before creating (they need to be saved separately)
      const itemsWithoutMitigation = items?.map(({ mitigation, ...itemData }) => itemData);
      const itemMitigations = items?.map((item) => item.mitigation);

      const assessment = await this.prisma.riskAssessment.create({
        data: {
          ...data,
          createdBy: userId, // Use authenticated user ID from request
          ...(itemsWithoutMitigation &&
            itemsWithoutMitigation.length > 0 && {
            items: {
              create: itemsWithoutMitigation as any, // Prisma will automatically map mRiskId to mriskid column via @map
            },
          }),
        } as any,
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
      createdAssessmentId = assessment.id;
      console.log(
        `[RiskAssessment] create persisted assessmentId=${assessment.id} code=${assessment.code}`,
      );

      // Create mitigation records for items
      const assessmentWithItems = assessment as any as RiskAssessment & {
        items: (RiskAssessmentItem & {
          mRisk: any;
          mRiskCategory: any;
        })[];
      };

      if (assessmentWithItems.items?.length > 0 && itemMitigations) {
        for (let i = 0; i < assessmentWithItems.items.length; i++) {
          const mitigation = itemMitigations[i];
          if (mitigation) {
            await this.createMitigationRecord(assessmentWithItems.items[i].id, mitigation);
          }
        }
      }

      const assessmentWithRelations =
        await this.prisma.riskAssessment.findUnique({
          where: { id: assessment.id },
          include: {
            items: {
              where: isNotDeleted,
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

      if (!assessmentWithRelations) {
        throw new NotFoundException(
          `Risk assessment with ID ${assessment.id} not found`,
        );
      }

      // Create reminder if status is SCHEDULED
      if (assessmentWithRelations.status === GeneralStatusEnum.SCHEDULED) {
        const reminderUserId = assessmentWithRelations.assigneeId || userId;
        try {
          await this.createReminderForRiskAssessment(
            assessmentWithRelations.id,
            assessmentWithRelations.assessmentDate,
            reminderUserId,
            assessmentWithRelations.code,
          );
        } catch (error) {
          // Log error but don't fail the entire create operation
          // The reminder creation failure should not prevent risk assessment creation
          console.error(
            `[RiskAssessment] Reminder creation failed for assessment ${assessmentWithRelations.id}, but assessment was created successfully:`,
            error,
          );
        }
      }

      return this.mapToDtoWithMitigations(assessmentWithRelations);
    } catch (error: any) {
      console.error('[RiskAssessment] create failed', {
        assessmentId: createdAssessmentId,
        code: createRiskAssessmentDto.code,
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
        responseBody: error?.responseBody,
        statusCode: error?.statusCode,
      });
      if (createdAssessmentId) {
        console.log(
          `[RiskAssessment] create triggering cleanup assessmentId=${createdAssessmentId}`,
        );
        await this.cleanupFailedRiskAssessmentCreation(createdAssessmentId);
      }

      // Handle Prisma unique constraint error for code
      if (error.code === PRISMA_ERROR_CODES.UNIQUE_VIOLATION && error.meta?.target?.includes('code')) {
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

    const whereActive = { ...where, ...isNotDeleted };

    const [assessments, total] = await Promise.all([
      this.prisma.riskAssessment.findMany({
        where: whereActive,
        include: {
          items: {
            where: isNotDeleted,
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
      this.prisma.riskAssessment.count({ where: whereActive }),
    ]);

    // Fetch all mitigation records for all items in all assessments
    const allItemIds = assessments.flatMap((a) => a.items.map((item) => item.id));
    const mitigationRecords = await this.prisma.riskMitigationRecord.findMany({
      where: {
        entity: RISK_ASSESSMENT_ITEM_ENTITY,
        entityId: { in: allItemIds },
        isActive: true,
        ...isNotDeleted,
      },
    });

    // Create a map of itemId -> mitigation record
    const mitigationMap = new Map<string, RiskMitigationRecord>();
    mitigationRecords.forEach((record) => {
      mitigationMap.set(record.entityId, record);
    });

    return {
      data: assessments.map((assessment) =>
        this.mapToDtoWithMitigationMap(assessment, mitigationMap),
      ),
      meta: { total, page, limit },
    };
  }

  async findOne(id: string): Promise<RiskAssessmentDto> {
    const assessment = await this.prisma.riskAssessment.findUnique({
      where: { id },
      include: {
        items: {
          where: isNotDeleted,
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

    return this.mapToDtoWithMitigations(assessment as any);
  }

  async update(
    id: string,
    updateRiskAssessmentDto: UpdateRiskAssessmentDto,
    userId?: string,
  ): Promise<RiskAssessmentDto> {
    const { items, ...data } = updateRiskAssessmentDto;

    // First, find the assessment to update
    const existingAssessment = await this.prisma.riskAssessment.findFirst({
      where: { id, ...isNotDeleted },
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
    const statusChangedToWaitingApproval =
      oldStatus !== GeneralStatusEnum.WAITING_APPROVAL &&
      newStatus === GeneralStatusEnum.WAITING_APPROVAL;
    const assessmentDateChanged =
      data.assessmentDate &&
      data.assessmentDate.getTime() !==
      existingAssessment.assessmentDate.getTime();

    // Soft-delete existing line items and mitigation records if items are being replaced
    if (items) {
      const activeItemIds = existingAssessment.items
        .filter((item) => item.deletedAt == null)
        .map((item) => item.id);
      if (activeItemIds.length > 0) {
        await this.prisma.riskMitigationRecord.updateMany({
          where: {
            entity: RISK_ASSESSMENT_ITEM_ENTITY,
            entityId: { in: activeItemIds },
            ...isNotDeleted,
          },
          data: buildSoftDeleteDataWithInactive(userId),
        });
        await this.prisma.riskAssessmentItem.updateMany({
          where: { id: { in: activeItemIds } },
          data: buildSoftDeleteData(userId),
        });
      }
    }

    // Extract mitigations from items before creating (they need to be saved separately)
    const itemsWithoutMitigation = items?.map(({ mitigation, ...itemData }) => itemData);
    const itemMitigations = items?.map((item) => item.mitigation);

    // Update the assessment and its items
    const assessment = await this.prisma.riskAssessment.update({
      where: { id },
      data: {
        ...data,
        ...(itemsWithoutMitigation && {
          items: {
            create: itemsWithoutMitigation as any, // Prisma will automatically map mRiskId to mriskid column via @map
          },
        }),
      } as any,
      include: {
        items: {
          where: isNotDeleted,
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

    // Create mitigation records for new items
    const assessmentWithItems = assessment as any as RiskAssessment & {
      items: (RiskAssessmentItem & {
        mRisk: any;
        mRiskCategory: any;
      })[];
    };

    if (assessmentWithItems.items?.length > 0 && itemMitigations) {
      for (let i = 0; i < assessmentWithItems.items.length; i++) {
        const mitigation = itemMitigations[i];
        if (mitigation) {
          await this.createMitigationRecord(assessmentWithItems.items[i].id, mitigation);
        }
      }
    }

    // Note: Approval records (t_approvals) should only be created when an approver
    // actually submits their approval/rejection action, not when status changes to WAITING_APPROVAL.
    // The approval workflow is defined in m_approvals and shown in allApprovalLines.

    // Notify requester + first approval line when submitted for approval
    if (statusChangedToWaitingApproval) {
      await this.masterApprovalsService.sendApprovalRequestNotifications(
        assessment.id,
        APPROVAL_ENTITIES.RISK_ASSESSMENT,
        assessment.createdBy,
      );
    }

    // Handle reminder creation/deletion based on status changes
    if (statusChangedFromScheduled) {
      // Status changed from SCHEDULED to something else - delete reminders
      try {
        await this.deleteRemindersForRiskAssessment(id);
      } catch (error) {
        console.error(
          `[RiskAssessment] Failed to delete reminders for assessment ${id}:`,
          error,
        );
      }
    } else if (statusChangedToScheduled) {
      // Status changed to SCHEDULED - create reminder
      const reminderUserId = assessment.assigneeId || assessment.createdBy;
      try {
        await this.createReminderForRiskAssessment(
          assessment.id,
          assessment.assessmentDate,
          reminderUserId,
          assessment.code,
        );
      } catch (error) {
        console.error(
          `[RiskAssessment] Reminder creation failed for assessment ${assessment.id}, but assessment was updated successfully:`,
          error,
        );
      }
    } else if (
      assessment.status === GeneralStatusEnum.SCHEDULED &&
      assessmentDateChanged
    ) {
      // Status is still SCHEDULED but assessmentDate changed - delete old and create new reminder
      try {
        await this.deleteRemindersForRiskAssessment(id);
      } catch (error) {
        console.error(
          `[RiskAssessment] Failed to delete old reminders for assessment ${id}:`,
          error,
        );
      }
      const reminderUserId = assessment.assigneeId || assessment.createdBy;
      try {
        await this.createReminderForRiskAssessment(
          assessment.id,
          assessment.assessmentDate,
          reminderUserId,
          assessment.code,
        );
      } catch (error) {
        console.error(
          `[RiskAssessment] Reminder creation failed for assessment ${assessment.id}, but assessment was updated successfully:`,
          error,
        );
      }
    }

    return this.mapToDtoWithMitigations(assessment as any);
  }

  async remove(id: string, deletedBy?: string): Promise<void> {
    const assessment = await this.prisma.riskAssessment.findFirst({
      where: { id, ...isNotDeleted },
      include: {
        items: {
          where: isNotDeleted,
          select: { id: true },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException(`Risk Assessment with ID ${id} not found`);
    }

    const itemIds = assessment.items.map((i) => i.id);
    if (itemIds.length > 0) {
      await this.prisma.riskMitigationRecord.updateMany({
        where: {
          entity: RISK_ASSESSMENT_ITEM_ENTITY,
          entityId: { in: itemIds },
          ...isNotDeleted,
        },
        data: buildSoftDeleteDataWithInactive(deletedBy),
      });
      await this.prisma.riskAssessmentItem.updateMany({
        where: { id: { in: itemIds } },
        data: buildSoftDeleteData(deletedBy),
      });
    }

    await this.deleteRemindersForRiskAssessment(id);

    await this.prisma.riskAssessment.update({
      where: { id },
      data: buildSoftDeleteDataWithInactive(deletedBy),
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
      // Idempotency: cancel any reminder still pending for this assessment so a
      // double submit / concurrent status change can never leave two active
      // reminders firing duplicate notifications.
      await this.deleteRemindersForRiskAssessment(assessmentId);

      const now = new Date();
      const assessmentReminderTime =
        this.convertAssessmentDateToReminderTime(assessmentDate);

      // Only create reminder if assessmentDate reminder time is in the future
      if (assessmentReminderTime <= now) {
        console.log(
          `[RiskAssessment] Skipping reminder creation for ${assessmentId}: assessmentDate reminder time (${assessmentReminderTime.toISOString()}) is not in the future (now: ${now.toISOString()})`,
        );
        return;
      }

      // Get the first reminder date (today or tomorrow)
      const firstReminderDate = this.getFirstReminderDate();

      // Only create if first reminder date is before or equal to assessmentDate
      if (firstReminderDate > assessmentReminderTime) {
        console.log(
          `[RiskAssessment] Skipping reminder creation for ${assessmentId}: first reminder date (${firstReminderDate.toISOString()}) is after assessment date (${assessmentReminderTime.toISOString()})`,
        );
        return;
      }

      // Validate that remindAt is in the future with buffer (add 1 second buffer to account for timing)
      const remindAtWithBuffer = new Date(firstReminderDate);
      remindAtWithBuffer.setSeconds(remindAtWithBuffer.getSeconds() + 1);

      if (remindAtWithBuffer <= now) {
        console.log(
          `[RiskAssessment] Skipping reminder creation for ${assessmentId}: remindAt date (${remindAtWithBuffer.toISOString()}) is not in the future (now: ${now.toISOString()})`,
        );
        return;
      }

      // Set repeatUntil to assessmentDate at 09:00 AM GMT+7
      // This ensures the reminder fires on assessmentDate and stops after that
      const repeatUntil = new Date(assessmentReminderTime);

      console.log(
        `[RiskAssessment] Creating reminder for assessment ${assessmentId}: userId=${userId}, remindAt=${firstReminderDate.toISOString()}, repeatUntil=${repeatUntil.toISOString()}`,
      );

      const reminder = await this.remindersService.create(
        {
          targetType: ReminderTargetTypeEnum.USER,
          targetId: userId,
          entity: 't_risk_assessment',
          entityId: assessmentId,
          message: `Risk Assessment ${code} is scheduled for ${assessmentDate.toLocaleDateString()}`,
          remindAt: firstReminderDate.toISOString(),
          repeatType: ReminderRepeatTypeEnum.DAILY,
          repeatUntil: repeatUntil.toISOString(),
        },
        userId,
      );

      console.log(
        `[RiskAssessment] Successfully created reminder ${reminder.id} for assessment ${assessmentId}`,
      );
    } catch (error) {
      // Log detailed error information for debugging
      console.error(
        `[RiskAssessment] Failed to create reminder for risk assessment ${assessmentId}:`,
        {
          error: error?.message || error,
          stack: error?.stack,
          userId,
          assessmentDate: assessmentDate?.toISOString(),
          code,
          assessmentId,
        },
      );
      // Re-throw to allow proper error tracking, but wrap in try-catch at call site
      // This helps identify the issue in production logs
      throw error;
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
          status: ReminderStatusEnum.PENDING,
        },
      });

      for (const reminder of reminders) {
        await this.prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: ReminderStatusEnum.CANCELLED },
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
        likelihoodLevel: item.likelihoodLevel as any as string,
        consequenceLevel: item.consequenceLevel,
        riskMatrixRating: item.riskMatrixRating,
        interpretation: item.interpretation,
        postLikelihoodLevel: item.postLikelihoodLevel as any as string,
        postConsequenceLevel: item.postConsequenceLevel,
        postRiskMatrixRating: item.postRiskMatrixRating,
        postInterpretation: item.postInterpretation,
      })),
      assigneeId: assessment.assigneeId ?? undefined,
      assignee: assessment.assignee,
      actionPlan: assessment.actionPlan ?? undefined,
    };
  }

  /**
   * Map assessment to DTO with mitigations fetched from database
   */
  private async mapToDtoWithMitigations(
    assessment: RiskAssessment & {
      items: (RiskAssessmentItem & {
        mRisk: any;
        mRiskCategory: any;
      })[];
      department: any;
      creator: any;
      assignee: any;
    },
  ): Promise<RiskAssessmentDto> {
    // Fetch mitigation records for all items
    const itemIds = assessment.items.map((item) => item.id);
    const mitigationRecords = await this.prisma.riskMitigationRecord.findMany({
      where: {
        entity: RISK_ASSESSMENT_ITEM_ENTITY,
        entityId: { in: itemIds },
        isActive: true,
        ...isNotDeleted,
      },
    });

    // Create a map of itemId -> mitigation record
    const mitigationMap = new Map<string, RiskMitigationRecord>();
    mitigationRecords.forEach((record) => {
      mitigationMap.set(record.entityId, record);
    });

    return this.mapToDtoWithMitigationMap(assessment, mitigationMap);
  }

  /**
   * Map assessment to DTO using a pre-fetched mitigation map
   */
  private mapToDtoWithMitigationMap(
    assessment: RiskAssessment & {
      items: (RiskAssessmentItem & {
        mRisk: any;
        mRiskCategory: any;
      })[];
      department: any;
      creator: any;
      assignee: any;
    },
    mitigationMap: Map<string, RiskMitigationRecord>,
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
      items: assessment.items.map((item) => {
        const mitigationRecord = mitigationMap.get(item.id);
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
          postLikelihoodLevel: item.postLikelihoodLevel as any as string,
          postConsequenceLevel: item.postConsequenceLevel,
          postRiskMatrixRating: item.postRiskMatrixRating,
          postInterpretation: item.postInterpretation,
          mitigation: mitigationRecord
            ? this.mapMitigationToDto(mitigationRecord)
            : undefined,
        };
      }),
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
    const assessment = await this.prisma.riskAssessment.findFirst({
      where: { id: riskAssessmentId, ...isNotDeleted },
    });

    if (!assessment) {
      throw new NotFoundException(
        `Risk Assessment with ID ${riskAssessmentId} not found`,
      );
    }

    // Extract mitigation from DTO
    const { mitigation, ...itemData } = createItemDto;

    const item = await this.prisma.riskAssessmentItem.create({
      data: {
        ...itemData,
        riskAssessmentId,
      } as any,
      include: {
        mRisk: true,
        mRiskCategory: true,
      },
    });

    // Create mitigation record if provided
    let mitigationRecord: RiskMitigationRecord | null = null;
    if (mitigation) {
      mitigationRecord = await this.createMitigationRecord(item.id, mitigation);
    }

    return this.mapItemToDto(item as any as RiskAssessmentItem & {
      mRisk: any;
      mRiskCategory: any;
    }, mitigationRecord);
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
    const assessment = await this.prisma.riskAssessment.findFirst({
      where: { id: riskAssessmentId, ...isNotDeleted },
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
      ...isNotDeleted,
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

    // Fetch mitigation records for all items
    const itemIds = items.map((item) => item.id);
    const mitigationRecords = await this.prisma.riskMitigationRecord.findMany({
      where: {
        entity: RISK_ASSESSMENT_ITEM_ENTITY,
        entityId: { in: itemIds },
        isActive: true,
        ...isNotDeleted,
      },
    });

    // Create a map of itemId -> mitigation record
    const mitigationMap = new Map<string, RiskMitigationRecord>();
    mitigationRecords.forEach((record) => {
      mitigationMap.set(record.entityId, record);
    });

    return {
      data: items.map((item) =>
        this.mapItemToDto(item, mitigationMap.get(item.id)),
      ),
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
        ...isNotDeleted,
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

    // Fetch mitigation record for the item
    const mitigationRecord = await this.getMitigationRecord(itemId);

    return this.mapItemToDto(item as any as RiskAssessmentItem & {
      mRisk: any;
      mRiskCategory: any;
    }, mitigationRecord);
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
        ...isNotDeleted,
      },
    });

    if (!existingItem) {
      throw new NotFoundException(
        `Risk Assessment Item with ID ${itemId} not found`,
      );
    }

    // Extract mitigation from DTO
    const { mitigation, ...itemData } = updateItemDto;

    const item = await this.prisma.riskAssessmentItem.update({
      where: { id: itemId },
      data: itemData as any,
      include: {
        mRisk: true,
        mRiskCategory: true,
      },
    });

    // Update or create mitigation record if provided
    let mitigationRecord: RiskMitigationRecord | null = null;
    if (mitigation) {
      mitigationRecord = await this.upsertMitigationRecord(itemId, mitigation);
    } else {
      // Fetch existing mitigation record if any
      mitigationRecord = await this.getMitigationRecord(itemId);
    }

    return this.mapItemToDto(item as any as RiskAssessmentItem & {
      mRisk: any;
      mRiskCategory: any;
    }, mitigationRecord);
  }

  async removeItem(
    riskAssessmentId: string,
    itemId: string,
    deletedBy?: string,
  ): Promise<void> {
    const item = await this.prisma.riskAssessmentItem.findFirst({
      where: {
        id: itemId,
        riskAssessmentId,
        ...isNotDeleted,
      },
    });

    if (!item) {
      throw new NotFoundException(
        `Risk Assessment Item with ID ${itemId} not found`,
      );
    }

    await this.softDeleteMitigationRecordForItem(itemId, deletedBy);

    await this.prisma.riskAssessmentItem.update({
      where: { id: itemId },
      data: buildSoftDeleteData(deletedBy),
    });
  }

  private mapItemToDto(
    item: RiskAssessmentItem & {
      mRisk: any;
      mRiskCategory: any;
    },
    mitigationRecord?: RiskMitigationRecord | null,
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
      postLikelihoodLevel: item.postLikelihoodLevel as any as string,
      postConsequenceLevel: item.postConsequenceLevel,
      postRiskMatrixRating: item.postRiskMatrixRating,
      postInterpretation: item.postInterpretation,
      mitigation: mitigationRecord
        ? this.mapMitigationToDto(mitigationRecord)
        : undefined,
    };
  }

  // Mitigation record helper methods

  /**
   * Generate unique mitigation code: RSK + YYMMDDHHmmss
   */
  private generateMitigationCode(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const date = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    const second = now.getSeconds().toString().padStart(2, '0');
    return `RSK${year}${month}${date}${hour}${minute}${second}`;
  }

  /**
   * Create a new mitigation record for a risk assessment item
   */
  private async createMitigationRecord(
    itemId: string,
    mitigation: RiskMitigationDataDto,
  ): Promise<RiskMitigationRecord> {
    return this.prisma.riskMitigationRecord.create({
      data: {
        code: this.generateMitigationCode(),
        entity: RISK_ASSESSMENT_ITEM_ENTITY,
        entityId: itemId,
        eliminationControl: mitigation.eliminationControl || null,
        substitutionControl: mitigation.substitutionControl || null,
        engineeringControl: mitigation.engineeringControl || null,
        administrationControl: mitigation.administrationControl || null,
        personalProtectiveEquipment: mitigation.personalProtectiveEquipment || null,
        transfer: mitigation.transfer || null,
        accept: mitigation.accept || null,
        legalAspect: mitigation.legalAspect || null,
        isActive: true,
      },
    });
  }

  /**
   * Get mitigation record for a risk assessment item
   */
  private async getMitigationRecord(
    itemId: string,
  ): Promise<RiskMitigationRecord | null> {
    return this.prisma.riskMitigationRecord.findFirst({
      where: {
        entity: RISK_ASSESSMENT_ITEM_ENTITY,
        entityId: itemId,
        isActive: true,
        ...isNotDeleted,
      },
    });
  }

  /**
   * Update or create mitigation record for a risk assessment item
   */
  private async upsertMitigationRecord(
    itemId: string,
    mitigation: RiskMitigationDataDto,
  ): Promise<RiskMitigationRecord> {
    const existing = await this.getMitigationRecord(itemId);

    if (existing) {
      return this.prisma.riskMitigationRecord.update({
        where: { id: existing.id },
        data: {
          eliminationControl: mitigation.eliminationControl || null,
          substitutionControl: mitigation.substitutionControl || null,
          engineeringControl: mitigation.engineeringControl || null,
          administrationControl: mitigation.administrationControl || null,
          personalProtectiveEquipment: mitigation.personalProtectiveEquipment || null,
          transfer: mitigation.transfer || null,
          accept: mitigation.accept || null,
          legalAspect: mitigation.legalAspect || null,
        },
      });
    }

    return this.createMitigationRecord(itemId, mitigation);
  }

  /**
   * Soft-delete mitigation record(s) for a risk assessment item
   */
  private async softDeleteMitigationRecordForItem(
    itemId: string,
    deletedBy?: string,
  ): Promise<void> {
    await this.prisma.riskMitigationRecord.updateMany({
      where: {
        entity: RISK_ASSESSMENT_ITEM_ENTITY,
        entityId: itemId,
        ...isNotDeleted,
      },
      data: buildSoftDeleteDataWithInactive(deletedBy),
    });
  }

  /**
   * Map mitigation record to DTO
   */
  private mapMitigationToDto(
    record: RiskMitigationRecord,
  ): RiskMitigationRecordDto {
    return {
      id: record.id,
      code: record.code,
      entity: record.entity,
      entityId: record.entityId,
      eliminationControl: record.eliminationControl || undefined,
      substitutionControl: record.substitutionControl || undefined,
      engineeringControl: record.engineeringControl || undefined,
      administrationControl: record.administrationControl || undefined,
      personalProtectiveEquipment: record.personalProtectiveEquipment || undefined,
      transfer: record.transfer || undefined,
      accept: record.accept || undefined,
      legalAspect: record.legalAspect || undefined,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private async cleanupFailedRiskAssessmentCreation(
    riskAssessmentId: string,
  ): Promise<void> {
    try {
      console.log(
        `[RiskAssessment] cleanup start assessmentId=${riskAssessmentId}`,
      );
      await this.deleteRemindersForRiskAssessment(riskAssessmentId);
      const itemIds = (
        await this.prisma.riskAssessmentItem.findMany({
          where: { riskAssessmentId },
          select: { id: true },
        })
      ).map((item) => item.id);
      console.log('[RiskAssessment] cleanup collected item ids', {
        assessmentId: riskAssessmentId,
        itemIds,
      });
      await this.prisma.riskMitigationRecord.deleteMany({
        where: {
          entity: RISK_ASSESSMENT_ITEM_ENTITY,
          entityId: {
            in: itemIds,
          },
        },
      });
      console.log(
        `[RiskAssessment] cleanup deleting assessment items assessmentId=${riskAssessmentId}`,
      );
      await this.prisma.riskAssessmentItem.deleteMany({
        where: { riskAssessmentId },
      });
      console.log(
        `[RiskAssessment] cleanup deleting assessment row assessmentId=${riskAssessmentId}`,
      );
      await this.prisma.riskAssessment.delete({
        where: { id: riskAssessmentId },
      });
      console.log(
        `[RiskAssessment] cleanup success assessmentId=${riskAssessmentId}`,
      );
    } catch (cleanupError) {
      console.error(
        `[RiskAssessment] Failed to cleanup assessment ${riskAssessmentId} after Zoho create failure:`,
        cleanupError,
      );
    }
  }

}
