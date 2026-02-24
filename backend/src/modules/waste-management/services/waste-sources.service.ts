import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';
import {
  CreateWasteSourceDto,
  UpdateWasteSourceDto,
  WasteSourceDto,
} from '../dto/waste-sources';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
  sourceType?: string;
}

@Injectable()
export class WasteSourcesService {
  private wasteSourceMapper: (entity: any) => WasteSourceDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
  ) {
    this.wasteSourceMapper = this.dtoMapper.createSimpleMapper(WasteSourceDto);
  }

  async create(createDto: CreateWasteSourceDto): Promise<WasteSourceDto> {
    const existing = await this.prisma.wasteSource.findUnique({
      where: { code: createDto.code },
    });
    if (existing) {
      this.errorHandler.throwConflictCustom(
        `Waste Source with code ${createDto.code} already exists`,
      );
    }
    const item = await this.prisma.wasteSource.create({ data: createDto });
    return this.wasteSourceMapper(item);
  }

  async findAll(options?: FindAllOptions): Promise<{
    data: WasteSourceDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc',
      isActive,
      search,
      sourceType,
    } = options || {};
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive;
    if (sourceType) where.sourceType = sourceType;

    const [items, total] = await Promise.all([
      this.prisma.wasteSource.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.wasteSource.count({ where }),
    ]);

    return {
      data: items.map(this.wasteSourceMapper),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<WasteSourceDto> {
    const item = await this.prisma.wasteSource.findUnique({ where: { id } });
    this.errorHandler.throwIfNotFoundById('Waste Source', id, item);
    return this.wasteSourceMapper(item);
  }

  async update(
    id: string,
    updateDto: UpdateWasteSourceDto,
  ): Promise<WasteSourceDto> {
    const existing = await this.prisma.wasteSource.findUnique({
      where: { id },
    });
    this.errorHandler.throwIfNotFoundById('Waste Source', id, existing);

    if (updateDto.code && updateDto.code !== existing.code) {
      const existingByCode = await this.prisma.wasteSource.findUnique({
        where: { code: updateDto.code },
      });
      if (existingByCode) {
        this.errorHandler.throwConflictCustom(
          `Waste Source with code ${updateDto.code} already exists`,
        );
      }
    }

    const updated = await this.prisma.wasteSource.update({
      where: { id },
      data: updateDto,
    });
    return this.wasteSourceMapper(updated);
  }

  async remove(id: string): Promise<void> {
    const item = await this.prisma.wasteSource.findUnique({
      where: { id },
      include: { weightReports: true },
    });
    this.errorHandler.throwIfNotFoundById('Waste Source', id, item);
    if (item.weightReports.length > 0) {
      this.errorHandler.throwConflictCustom(
        `Cannot delete Waste Source with associated weight reports`,
      );
    }
    await this.prisma.wasteSource.delete({ where: { id } });
  }
}
