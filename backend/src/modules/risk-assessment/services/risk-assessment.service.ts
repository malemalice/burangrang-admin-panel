/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateRiskAssessmentDto } from '../dto/create-risk-assessment.dto';
import { UpdateRiskAssessmentDto } from '../dto/update-risk-assessment.dto';
import { RiskAssessmentDto } from '../dto/risk-assessment.dto';
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
            create: items, // Prisma will automatically map mRiskId to mThreatId column via @map
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
            create: items, // Prisma will automatically map mRiskId to mThreatId column via @map
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
        riskDescription: item.riskDescription,
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
}
