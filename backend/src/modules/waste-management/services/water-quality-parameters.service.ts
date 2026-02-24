import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';
import {
  CreateWaterQualityParameterDto,
  UpdateWaterQualityParameterDto,
  WaterQualityParameterDto,
} from '../dto/water-quality-parameters';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
}

@Injectable()
export class WaterQualityParametersService {
  private parameterMapper: (entity: any) => WaterQualityParameterDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
  ) {
    this.parameterMapper = this.dtoMapper.createMapper(
      WaterQualityParameterDto,
      {
        transform: {
          standardLimit: (val) => (val ? Number(val) : undefined),
          regulatoryLimit: (val) => (val ? Number(val) : undefined),
          displayOrder: (val) => (val != null ? Number(val) : undefined),
        },
      },
    );
  }

  async create(
    createDto: CreateWaterQualityParameterDto,
  ): Promise<WaterQualityParameterDto> {
    const existingByCode = await this.prisma.waterQualityParameter.findUnique({
      where: { code: createDto.code },
    });
    if (existingByCode) {
      this.errorHandler.throwConflictCustom(
        `Water Quality Parameter with code ${createDto.code} already exists`,
      );
    }
    const parameter = await this.prisma.waterQualityParameter.create({
      data: createDto,
    });
    return this.parameterMapper(parameter);
  }

  async findAll(options?: FindAllOptions): Promise<{
    data: WaterQualityParameterDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'displayOrder',
      sortOrder = 'asc',
      isActive,
      search,
    } = options || {};
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { unit: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive;

    const orderBy: any =
      sortBy === 'displayOrder'
        ? [{ displayOrder: sortOrder }, { name: 'asc' }]
        : { [sortBy]: sortOrder };

    const [items, total] = await Promise.all([
      this.prisma.waterQualityParameter.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.waterQualityParameter.count({ where }),
    ]);

    return {
      data: items.map(this.parameterMapper),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<WaterQualityParameterDto> {
    const parameter = await this.prisma.waterQualityParameter.findUnique({
      where: { id },
    });
    this.errorHandler.throwIfNotFoundById(
      'Water Quality Parameter',
      id,
      parameter,
    );
    return this.parameterMapper(parameter);
  }

  async update(
    id: string,
    updateDto: UpdateWaterQualityParameterDto,
  ): Promise<WaterQualityParameterDto> {
    const existing = await this.prisma.waterQualityParameter.findUnique({
      where: { id },
    });
    this.errorHandler.throwIfNotFoundById(
      'Water Quality Parameter',
      id,
      existing,
    );

    if (updateDto.code && updateDto.code !== existing.code) {
      const existingByCode = await this.prisma.waterQualityParameter.findUnique(
        {
          where: { code: updateDto.code },
        },
      );
      if (existingByCode) {
        this.errorHandler.throwConflictCustom(
          `Water Quality Parameter with code ${updateDto.code} already exists`,
        );
      }
    }

    const updated = await this.prisma.waterQualityParameter.update({
      where: { id },
      data: updateDto,
    });
    return this.parameterMapper(updated);
  }

  async remove(id: string): Promise<void> {
    const parameter = await this.prisma.waterQualityParameter.findUnique({
      where: { id },
    });
    this.errorHandler.throwIfNotFoundById(
      'Water Quality Parameter',
      id,
      parameter,
    );
    await this.prisma.waterQualityParameter.delete({ where: { id } });
  }
}
