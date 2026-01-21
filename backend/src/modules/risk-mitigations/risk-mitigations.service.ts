import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateRiskMitigationDto } from './dto/create-risk-mitigation.dto';
import { UpdateRiskMitigationDto } from './dto/update-risk-mitigation.dto';
import { RiskMitigationDto } from './dto/risk-mitigation.dto';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  riskId?: string;
  search?: string;
}

@Injectable()
export class RiskMitigationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRiskMitigationDto: CreateRiskMitigationDto): Promise<RiskMitigationDto> {
    // Verify the Risk exists first
    const risk = await (this.prisma as any).risk.findUnique({
      where: { id: createRiskMitigationDto.riskId }
    });

    if (!risk) {
      throw new NotFoundException(`Risk with ID ${createRiskMitigationDto.riskId} not found`);
    }

    // Create the risk mitigation
    const mitigation = await (this.prisma as any).riskMitigation.create({
      data: createRiskMitigationDto,
      include: {
        risk: true,
      },
    });

    return this.mapToDto(mitigation);
  }

  async findAll(options?: FindAllOptions): Promise<{ data: RiskMitigationDto[]; meta: { total: number; page: number; limit: number } }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'asc',
      isActive,
      riskId,
      search,
    } = options || {};

    // Using 'any' as a workaround until the Prisma client is regenerated
    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (riskId) {
      where.riskId = riskId;
    }

    // Search by risk name, risk code, or mitigation text fields (MDRMG-008, MDRMG-009)
    if (search) {
      where.OR = [
        { risk: { name: { contains: search, mode: 'insensitive' } } },
        { risk: { code: { contains: search, mode: 'insensitive' } } },
        { eliminate: { contains: search, mode: 'insensitive' } },
        { transfer: { contains: search, mode: 'insensitive' } },
        { reduce: { contains: search, mode: 'insensitive' } },
        { accept: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [mitigations, total] = await Promise.all([
      (this.prisma as any).riskMitigation.findMany({
        where,
        include: {
          risk: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (this.prisma as any).riskMitigation.count({ where }),
    ]);

    return {
      data: mitigations.map(mitigation => this.mapToDto(mitigation)),
      meta: { total, page, limit },
    };
  }

  async findOne(id: string): Promise<RiskMitigationDto> {
    const mitigation = await (this.prisma as any).riskMitigation.findUnique({
      where: { id },
      include: {
        risk: true,
      },
    });

    if (!mitigation) {
      throw new NotFoundException(`Risk mitigation with ID ${id} not found`);
    }

    return this.mapToDto(mitigation);
  }

  async update(id: string, updateRiskMitigationDto: UpdateRiskMitigationDto): Promise<RiskMitigationDto> {
    const existingMitigation = await (this.prisma as any).riskMitigation.findUnique({
      where: { id },
    });

    if (!existingMitigation) {
      throw new NotFoundException(`Risk mitigation with ID ${id} not found`);
    }

    // If updating Risk ID, verify it exists
    if (updateRiskMitigationDto.riskId) {
      const risk = await (this.prisma as any).risk.findUnique({
        where: { id: updateRiskMitigationDto.riskId }
      });

      if (!risk) {
        throw new NotFoundException(`Risk with ID ${updateRiskMitigationDto.riskId} not found`);
      }
    }

    const updatedMitigation = await (this.prisma as any).riskMitigation.update({
      where: { id },
      data: updateRiskMitigationDto,
      include: {
        risk: true,
      },
    });

    return this.mapToDto(updatedMitigation);
  }

  async remove(id: string): Promise<void> {
    const mitigation = await (this.prisma as any).riskMitigation.findUnique({
      where: { id },
    });

    if (!mitigation) {
      throw new NotFoundException(`Risk mitigation with ID ${id} not found`);
    }

    await (this.prisma as any).riskMitigation.delete({
      where: { id },
    });
  }

  private mapToDto(mitigation: any): RiskMitigationDto {
    return {
      id: mitigation.id,
      eliminate: mitigation.eliminate,
      transfer: mitigation.transfer,
      reduce: mitigation.reduce,
      accept: mitigation.accept,
      isActive: mitigation.isActive,
      riskId: mitigation.riskId,
      risk: mitigation.risk,
      createdAt: mitigation.createdAt,
      updatedAt: mitigation.updatedAt,
    };
  }
}
