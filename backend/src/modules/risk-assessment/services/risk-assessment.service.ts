import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateRiskAssessmentDto } from '../dto/create-risk-assessment.dto';
import { UpdateRiskAssessmentDto } from '../dto/update-risk-assessment.dto';
import { RiskAssessmentDto } from '../dto/risk-assessment.dto';
import { Prisma } from '@prisma/client';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  departmentId?: string;
  status?: string;
}

@Injectable()
export class RiskAssessmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRiskAssessmentDto: CreateRiskAssessmentDto): Promise<RiskAssessmentDto> {
    const { items, ...data } = createRiskAssessmentDto;
    
    const assessment = await this.prisma.riskAssessment.create({
      data: {
        ...data,
        items: {
          create: items
        }
      },
      include: {
        items: true,
        department: true,
      },
    });

    return this.mapToDto(assessment);
  }

  async findAll(options?: FindAllOptions): Promise<{ data: RiskAssessmentDto[]; meta: { total: number; page: number; limit: number } }> {
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
          items: true,
          department: true,
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
      data: assessments.map(assessment => this.mapToDto(assessment)),
      meta: { total, page, limit },
    };
  }

  async findOne(id: string): Promise<RiskAssessmentDto> {
    const assessment = await this.prisma.riskAssessment.findUnique({
      where: { id },
      include: {
        items: true,
        department: true,
      },
    });

    if (!assessment) {
      throw new NotFoundException(`Risk Assessment with ID ${id} not found`);
    }

    return this.mapToDto(assessment);
  }

  async update(id: string, updateRiskAssessmentDto: UpdateRiskAssessmentDto): Promise<RiskAssessmentDto> {
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
            create: items
          }
        })
      },
      include: {
        items: true,
        department: true,
      },
    });

    return this.mapToDto(assessment);
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.riskAssessment.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Risk Assessment with ID ${id} not found`);
    }
  }

  private mapToDto(assessment: any): RiskAssessmentDto {
    return {
      id: assessment.id,
      code: assessment.code,
      departmentId: assessment.departmentId,
      assessmentDate: assessment.assessmentDate,
      createdAt: assessment.createdAt,
      updatedAt: assessment.updatedAt,
      createdBy: assessment.createdBy,
      status: assessment.status,
      isActive: assessment.isActive,
      items: assessment.items,
    };
  }
} 