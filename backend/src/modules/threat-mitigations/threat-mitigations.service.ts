import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateThreatMitigationDto } from './dto/create-threat-mitigation.dto';
import { UpdateThreatMitigationDto } from './dto/update-threat-mitigation.dto';
import { ThreatMitigationDto } from './dto/threat-mitigation.dto';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
  threatId?: string;
  level?: number;
}

@Injectable()
export class ThreatMitigationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createThreatMitigationDto: CreateThreatMitigationDto): Promise<ThreatMitigationDto> {
    // Verify the Risk exists first
    const risk = await (this.prisma as any).risk.findUnique({
      where: { id: createThreatMitigationDto.threatId }
    });

    if (!risk) {
      throw new NotFoundException(`Risk with ID ${createThreatMitigationDto.threatId} not found`);
    }

    // Create the threat mitigation
    const mitigation = await (this.prisma as any).threatMitigation.create({
      data: createThreatMitigationDto,
      include: {
        risk: true,
      },
    });

    return this.mapToDto(mitigation);
  }

  async findAll(options?: FindAllOptions): Promise<{ data: ThreatMitigationDto[]; meta: { total: number; page: number; limit: number } }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'level',
      sortOrder = 'asc',
      isActive,
      search,
      threatId,
      level,
    } = options || {};

    // Using 'any' as a workaround until the Prisma client is regenerated
    const where: any = {};
    
    if (search) {
      where.mitigationDescription = { contains: search, mode: 'insensitive' };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (threatId) {
      where.threatId = threatId;
    }

    if (level !== undefined) {
      where.level = level;
    }

    const [mitigations, total] = await Promise.all([
      (this.prisma as any).threatMitigation.findMany({
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
      (this.prisma as any).threatMitigation.count({ where }),
    ]);

    return {
      data: mitigations.map(mitigation => this.mapToDto(mitigation)),
      meta: { total, page, limit },
    };
  }

  async findOne(id: string): Promise<ThreatMitigationDto> {
    const mitigation = await (this.prisma as any).threatMitigation.findUnique({
      where: { id },
      include: {
        risk: true,
      },
    });

    if (!mitigation) {
      throw new NotFoundException(`Threat mitigation with ID ${id} not found`);
    }

    return this.mapToDto(mitigation);
  }

  async update(id: string, updateThreatMitigationDto: UpdateThreatMitigationDto): Promise<ThreatMitigationDto> {
    const existingMitigation = await (this.prisma as any).threatMitigation.findUnique({
      where: { id },
    });

    if (!existingMitigation) {
      throw new NotFoundException(`Threat mitigation with ID ${id} not found`);
    }

    // If updating Risk ID, verify it exists
    if (updateThreatMitigationDto.threatId) {
      const risk = await (this.prisma as any).risk.findUnique({
        where: { id: updateThreatMitigationDto.threatId }
      });

      if (!risk) {
        throw new NotFoundException(`Risk with ID ${updateThreatMitigationDto.threatId} not found`);
      }
    }

    const updatedMitigation = await (this.prisma as any).threatMitigation.update({
      where: { id },
      data: updateThreatMitigationDto,
      include: {
        risk: true,
      },
    });

    return this.mapToDto(updatedMitigation);
  }

  async remove(id: string): Promise<void> {
    const mitigation = await (this.prisma as any).threatMitigation.findUnique({
      where: { id },
    });

    if (!mitigation) {
      throw new NotFoundException(`Threat mitigation with ID ${id} not found`);
    }

    await (this.prisma as any).threatMitigation.delete({
      where: { id },
    });
  }

  private mapToDto(mitigation: any): ThreatMitigationDto {
    return {
      id: mitigation.id,
      level: mitigation.level,
      mitigationDescription: mitigation.mitigationDescription,
      isActive: mitigation.isActive,
      threatId: mitigation.threatId,
      threat: mitigation.risk, // Map risk to threat for backward compatibility with DTO
      createdAt: mitigation.createdAt,
      updatedAt: mitigation.updatedAt,
    };
  }
} 