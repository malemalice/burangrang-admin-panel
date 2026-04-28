import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { buildSoftDeleteDataWithInactive, isNotDeleted } from '../../shared/utils/soft-delete.util';
import { CreateRiskDto } from './dto/create-risk.dto';
import { UpdateRiskDto } from './dto/update-risk.dto';
import { RiskDto } from './dto/risk.dto';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
  riskCategoryId?: string;
  name?: string;
  code?: string;
}

@Injectable()
export class RisksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRiskDto: CreateRiskDto): Promise<RiskDto> {
    // Verify the type of hazard exists first
    const riskCategory = await (this.prisma as any).riskCategory.findFirst({
      where: { id: createRiskDto.riskCategoryId, ...isNotDeleted },
    });

    if (!riskCategory) {
      throw new NotFoundException(`Type of hazard with ID ${createRiskDto.riskCategoryId} not found`);
    }

    // Create the risk
    const risk = await (this.prisma as any).risk.create({
      data: createRiskDto,
      include: {
        riskCategory: true,
      },
    });

    return this.mapToDto(risk);
  }

  async findAll(options?: FindAllOptions): Promise<{ data: RiskDto[]; meta: { total: number; page: number; limit: number } }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc',
      isActive,
      search,
      riskCategoryId,
      name,
      code,
    } = options || {};

    // Using 'any' as a workaround until the Prisma client is regenerated
    const where: any = { ...isNotDeleted };
    
    // MDR-013: Search name field only. Filter 'name' takes precedence over search bar for name.
    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    } else if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (riskCategoryId) {
      where.riskCategoryId = riskCategoryId;
    }

    if (code) {
      where.code = { contains: code, mode: 'insensitive' };
    }

    const [risks, total] = await Promise.all([
      (this.prisma as any).risk.findMany({
        where,
        include: {
          riskCategory: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (this.prisma as any).risk.count({ where }),
    ]);

    return {
      data: risks.map(risk => this.mapToDto(risk)),
      meta: { total, page, limit },
    };
  }

  async findOne(id: string): Promise<RiskDto> {
    const risk = await (this.prisma as any).risk.findFirst({
      where: { id, ...isNotDeleted },
      include: {
        riskCategory: true,
        mitigations: true,
      },
    });

    if (!risk) {
      throw new NotFoundException(`Risk with ID ${id} not found`);
    }

    return this.mapToDto(risk);
  }

  async update(id: string, updateRiskDto: UpdateRiskDto): Promise<RiskDto> {
    const existingRisk = await (this.prisma as any).risk.findFirst({
      where: { id, ...isNotDeleted },
    });

    if (!existingRisk) {
      throw new NotFoundException(`Risk with ID ${id} not found`);
    }

    // If updating type of hazard ID, verify it exists
    if (updateRiskDto.riskCategoryId) {
      const riskCategory = await (this.prisma as any).riskCategory.findFirst({
        where: { id: updateRiskDto.riskCategoryId, ...isNotDeleted },
      });

      if (!riskCategory) {
        throw new NotFoundException(`Type of hazard with ID ${updateRiskDto.riskCategoryId} not found`);
      }
    }

    const updatedRisk = await (this.prisma as any).risk.update({
      where: { id },
      data: updateRiskDto,
      include: {
        riskCategory: true,
        mitigations: true,
      },
    });

    return this.mapToDto(updatedRisk);
  }

  async remove(id: string, deletedBy?: string): Promise<void> {
    const risk = await (this.prisma as any).risk.findFirst({
      where: { id, ...isNotDeleted },
      include: {
        mitigations: { where: { ...isNotDeleted } },
      },
    });

    if (!risk) {
      throw new NotFoundException(`Risk with ID ${id} not found`);
    }

    // Check if the risk has mitigations
    if (risk.mitigations.length > 0) {
      throw new NotFoundException(`Cannot delete risk with ID ${id} because it has associated mitigations`);
    }

    await (this.prisma as any).risk.update({
      where: { id },
      data: buildSoftDeleteDataWithInactive(deletedBy),
    });
  }

  private mapToDto(risk: any): RiskDto {
    return {
      id: risk.id,
      name: risk.name,
      code: risk.code,
      description: risk.description,
      isActive: risk.isActive,
      riskCategoryId: risk.riskCategoryId,
      riskCategory: risk.riskCategory,
      createdAt: risk.createdAt,
      updatedAt: risk.updatedAt,
      mitigations: risk.mitigations,
    };
  }
}
