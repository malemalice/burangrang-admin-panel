import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';
import { CreateWasteTypeDto, UpdateWasteTypeDto, WasteTypeDto } from '../dto/waste-types';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
  wasteType?: string;
}

@Injectable()
export class WasteTypesService {
  private wasteTypeMapper: (entity: any) => WasteTypeDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
  ) {
    this.wasteTypeMapper = this.dtoMapper.createSimpleMapper(WasteTypeDto);
  }

  async create(createDto: CreateWasteTypeDto): Promise<WasteTypeDto> {
    const existing = await this.prisma.wasteType.findUnique({ where: { code: createDto.code } });
    if (existing) {
      this.errorHandler.throwConflictCustom(`Waste Type with code ${createDto.code} already exists`);
    }
    const item = await this.prisma.wasteType.create({ data: createDto });
    return this.wasteTypeMapper(item);
  }

  async findAll(options?: FindAllOptions): Promise<{ data: WasteTypeDto[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc', isActive, search, wasteType } = options || {};
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive;
    if (wasteType) where.wasteType = wasteType;

    const [items, total] = await Promise.all([
      this.prisma.wasteType.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.wasteType.count({ where }),
    ]);

    return {
      data: items.map(this.wasteTypeMapper),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<WasteTypeDto> {
    const item = await this.prisma.wasteType.findUnique({ where: { id } });
    this.errorHandler.throwIfNotFoundById('Waste Type', id, item);
    return this.wasteTypeMapper(item);
  }

  async update(id: string, updateDto: UpdateWasteTypeDto): Promise<WasteTypeDto> {
    const existing = await this.prisma.wasteType.findUnique({ where: { id } });
    this.errorHandler.throwIfNotFoundById('Waste Type', id, existing);

    if (updateDto.code && updateDto.code !== existing.code) {
      const existingByCode = await this.prisma.wasteType.findUnique({ where: { code: updateDto.code } });
      if (existingByCode) {
        this.errorHandler.throwConflictCustom(`Waste Type with code ${updateDto.code} already exists`);
      }
    }

    const updated = await this.prisma.wasteType.update({ where: { id }, data: updateDto });
    return this.wasteTypeMapper(updated);
  }

  async remove(id: string): Promise<void> {
    const item = await this.prisma.wasteType.findUnique({
      where: { id },
      include: { weightReportItems: true },
    });
    this.errorHandler.throwIfNotFoundById('Waste Type', id, item);
    if (item.weightReportItems.length > 0) {
      this.errorHandler.throwConflictCustom(`Cannot delete Waste Type with ID ${id} because it has associated weight report items`);
    }
    await this.prisma.wasteType.delete({ where: { id } });
  }
}
