import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
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
  hseCategoryId?: string;
}

@Injectable()
export class RisksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRiskDto: CreateRiskDto): Promise<RiskDto> {
    // Verify the HSE category exists first
    const hseCategory = await (this.prisma as any).hseCategory.findUnique({
      where: { id: createRiskDto.hseCategoryId }
    });

    if (!hseCategory) {
      throw new NotFoundException(`HSE category with ID ${createRiskDto.hseCategoryId} not found`);
    }

    // Create the risk
    const risk = await (this.prisma as any).risk.create({
      data: createRiskDto,
      include: {
        hseCategory: true,
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
      hseCategoryId,
    } = options || {};

    // Using 'any' as a workaround until the Prisma client is regenerated
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (hseCategoryId) {
      where.hseCategoryId = hseCategoryId;
    }

    const [risks, total] = await Promise.all([
      (this.prisma as any).risk.findMany({
        where,
        include: {
          hseCategory: true,
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
    const risk = await (this.prisma as any).risk.findUnique({
      where: { id },
      include: {
        hseCategory: true,
        mitigations: true,
      },
    });

    if (!risk) {
      throw new NotFoundException(`Risk with ID ${id} not found`);
    }

    return this.mapToDto(risk);
  }

  async update(id: string, updateRiskDto: UpdateRiskDto): Promise<RiskDto> {
    const existingRisk = await (this.prisma as any).risk.findUnique({
      where: { id },
    });

    if (!existingRisk) {
      throw new NotFoundException(`Risk with ID ${id} not found`);
    }

    // If updating HSE Category ID, verify it exists
    if (updateRiskDto.hseCategoryId) {
      const hseCategory = await (this.prisma as any).hseCategory.findUnique({
        where: { id: updateRiskDto.hseCategoryId }
      });

      if (!hseCategory) {
        throw new NotFoundException(`HSE category with ID ${updateRiskDto.hseCategoryId} not found`);
      }
    }

    const updatedRisk = await (this.prisma as any).risk.update({
      where: { id },
      data: updateRiskDto,
      include: {
        hseCategory: true,
        mitigations: true,
      },
    });

    return this.mapToDto(updatedRisk);
  }

  async remove(id: string): Promise<void> {
    const risk = await (this.prisma as any).risk.findUnique({
      where: { id },
      include: {
        mitigations: true,
      },
    });

    if (!risk) {
      throw new NotFoundException(`Risk with ID ${id} not found`);
    }

    // Check if the risk has mitigations
    if (risk.mitigations.length > 0) {
      throw new NotFoundException(`Cannot delete risk with ID ${id} because it has associated mitigations`);
    }

    await (this.prisma as any).risk.delete({
      where: { id },
    });
  }

  private mapToDto(risk: any): RiskDto {
    return {
      id: risk.id,
      name: risk.name,
      code: risk.code,
      description: risk.description,
      isActive: risk.isActive,
      hseCategoryId: risk.hseCategoryId,
      hseCategory: risk.hseCategory,
      createdAt: risk.createdAt,
      updatedAt: risk.updatedAt,
      mitigations: risk.mitigations,
    };
  }
}
