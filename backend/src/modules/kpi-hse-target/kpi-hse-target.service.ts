import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { CreateHseTargetDto } from './dto/create-hse-target.dto';
import { UpdateHseTargetDto } from './dto/update-hse-target.dto';
import { HseTargetDto } from './dto/hse-target.dto';
import { HseTargetTypeEnum, MonthEnum } from '@prisma/client';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
  type?: HseTargetTypeEnum;
  code?: string;
  month?: MonthEnum;
  year?: number;
}

@Injectable()
export class KpiHseTargetService {
  private hseTargetMapper: (entity: any) => HseTargetDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
  ) {
    this.hseTargetMapper = (entity: any) => {
      if (!entity) return null as any;

      return new HseTargetDto({
        id: entity.id,
        type: entity.type,
        code: entity.code,
        name: entity.name,
        month: entity.month,
        year: entity.year,
        target: entity.target ? Number(entity.target) : 0,
        isActive: entity.isActive,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        createdBy: entity.createdBy,
        creator: entity.creator
          ? {
              id: entity.creator.id,
              firstName: entity.creator.firstName,
              lastName: entity.creator.lastName,
            }
          : undefined,
      });
    };
  }

  async create(createDto: CreateHseTargetDto, userId: string): Promise<HseTargetDto> {
    const existing = await this.prisma.hseTarget.findFirst({
      where: {
        type: createDto.type,
        code: createDto.code,
        month: createDto.month ?? null,
        year: createDto.year,
      },
    });

    if (existing) {
      this.errorHandler.throwConflictCustom('HSE Target already Exist');
    }

    const hseTarget = await this.prisma.hseTarget.create({
      data: {
        type: createDto.type,
        code: createDto.code,
        name: createDto.name,
        month: createDto.month ?? undefined,
        year: createDto.year,
        target: createDto.target,
        isActive: createDto.isActive ?? true,
        createdBy: userId,
      },
      include: {
        creator: true,
      },
    });

    return this.hseTargetMapper(hseTarget);
  }

  async findAll(
    options?: FindAllOptions,
  ): Promise<{ data: HseTargetDto[]; meta: { total: number; page: number; limit: number } }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'year',
      sortOrder = 'desc',
      isActive,
      search,
      type,
      code,
      month,
      year,
    } = options || {};

    const where: any = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (type) {
      where.type = type;
    }

    if (code) {
      where.code = code;
    }

    if (month !== undefined) {
      where.month = month;
    }

    if (year) {
      where.year = year;
    }

    const [hseTargets, total] = await Promise.all([
      this.prisma.hseTarget.findMany({
        where,
        orderBy: [
          { [sortBy]: sortOrder },
          { month: 'asc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          creator: true,
        },
      }),
      this.prisma.hseTarget.count({ where }),
    ]);

    return {
      data: hseTargets.map((h: any) => this.hseTargetMapper(h)),
      meta: { total, page, limit },
    };
  }

  async findOne(id: string): Promise<HseTargetDto> {
    const hseTarget = await this.prisma.hseTarget.findUnique({
      where: { id },
      include: {
        creator: true,
      },
    });

    this.errorHandler.throwIfNotFoundById('HSE target', id, hseTarget);

    return this.hseTargetMapper(hseTarget);
  }

  async update(id: string, updateDto: UpdateHseTargetDto): Promise<HseTargetDto> {
    const existing = await this.prisma.hseTarget.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('HSE target', id, existing);

    const updated = await this.prisma.hseTarget.update({
      where: { id },
      data: updateDto,
      include: {
        creator: true,
      },
    });

    return this.hseTargetMapper(updated);
  }

  async remove(id: string): Promise<void> {
    const hseTarget = await this.prisma.hseTarget.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('HSE target', id, hseTarget);

    await this.prisma.hseTarget.delete({
      where: { id },
    });
  }
}
