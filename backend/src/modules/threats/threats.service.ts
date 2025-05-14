import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateThreatDto } from './dto/create-threat.dto';
import { UpdateThreatDto } from './dto/update-threat.dto';
import { ThreatDto } from './dto/threat.dto';

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
export class ThreatsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createThreatDto: CreateThreatDto): Promise<ThreatDto> {
    // Verify the HSE category exists first
    const hseCategory = await (this.prisma as any).hseCategory.findUnique({
      where: { id: createThreatDto.hseCategoryId }
    });

    if (!hseCategory) {
      throw new NotFoundException(`HSE category with ID ${createThreatDto.hseCategoryId} not found`);
    }

    // Create the threat
    const threat = await (this.prisma as any).threat.create({
      data: createThreatDto,
      include: {
        hseCategory: true,
      },
    });

    return this.mapToDto(threat);
  }

  async findAll(options?: FindAllOptions): Promise<{ data: ThreatDto[]; meta: { total: number } }> {
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

    const [threats, total] = await Promise.all([
      (this.prisma as any).threat.findMany({
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
      (this.prisma as any).threat.count({ where }),
    ]);

    return {
      data: threats.map(threat => this.mapToDto(threat)),
      meta: { total },
    };
  }

  async findOne(id: string): Promise<ThreatDto> {
    const threat = await (this.prisma as any).threat.findUnique({
      where: { id },
      include: {
        hseCategory: true,
        mitigations: true,
      },
    });

    if (!threat) {
      throw new NotFoundException(`Threat with ID ${id} not found`);
    }

    return this.mapToDto(threat);
  }

  async update(id: string, updateThreatDto: UpdateThreatDto): Promise<ThreatDto> {
    const existingThreat = await (this.prisma as any).threat.findUnique({
      where: { id },
    });

    if (!existingThreat) {
      throw new NotFoundException(`Threat with ID ${id} not found`);
    }

    // If updating HSE Category ID, verify it exists
    if (updateThreatDto.hseCategoryId) {
      const hseCategory = await (this.prisma as any).hseCategory.findUnique({
        where: { id: updateThreatDto.hseCategoryId }
      });

      if (!hseCategory) {
        throw new NotFoundException(`HSE category with ID ${updateThreatDto.hseCategoryId} not found`);
      }
    }

    const updatedThreat = await (this.prisma as any).threat.update({
      where: { id },
      data: updateThreatDto,
      include: {
        hseCategory: true,
        mitigations: true,
      },
    });

    return this.mapToDto(updatedThreat);
  }

  async remove(id: string): Promise<void> {
    const threat = await (this.prisma as any).threat.findUnique({
      where: { id },
      include: {
        mitigations: true,
      },
    });

    if (!threat) {
      throw new NotFoundException(`Threat with ID ${id} not found`);
    }

    // Check if the threat has mitigations
    if (threat.mitigations.length > 0) {
      throw new NotFoundException(`Cannot delete threat with ID ${id} because it has associated mitigations`);
    }

    await (this.prisma as any).threat.delete({
      where: { id },
    });
  }

  private mapToDto(threat: any): ThreatDto {
    return {
      id: threat.id,
      name: threat.name,
      code: threat.code,
      description: threat.description,
      isActive: threat.isActive,
      hseCategoryId: threat.hseCategoryId,
      hseCategory: threat.hseCategory,
      createdAt: threat.createdAt,
      updatedAt: threat.updatedAt,
      mitigations: threat.mitigations,
    };
  }
} 