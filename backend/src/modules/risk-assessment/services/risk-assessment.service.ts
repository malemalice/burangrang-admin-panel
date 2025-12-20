/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
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

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  departmentId?: string;
  status?: GeneralStatusEnum;
}

@Injectable()
export class RiskAssessmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly approvalsService: ApprovalsService,
  ) {}

  async create(
    createRiskAssessmentDto: CreateRiskAssessmentDto,
    userId: string,
  ): Promise<RiskAssessmentDto> {
    const { items, createdBy, ...data } = createRiskAssessmentDto;

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

    return this.mapToDto(assessmentWithRelations);
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
    } = options || {};

    const where: Prisma.RiskAssessmentWhereInput = {};

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

    // Then delete the assessment
    await this.prisma.riskAssessment.delete({
      where: { id },
    });
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
