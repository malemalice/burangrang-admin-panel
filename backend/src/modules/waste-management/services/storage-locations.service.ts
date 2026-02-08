import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';
import {
  CreateStorageLocationDto,
  UpdateStorageLocationDto,
  StorageLocationDto,
} from '../dto/storage-locations';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
  areaId?: string;
}

@Injectable()
export class StorageLocationsService {
  private storageLocationMapper: (entity: any) => StorageLocationDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
  ) {
    this.storageLocationMapper = this.dtoMapper.createMapper(
      StorageLocationDto,
      {
        relations: {
          area: {
            mapper: (area) =>
              area
                ? { id: area.id, name: area.name, code: area.code }
                : undefined,
          },
          creator: {
            mapper: (creator) =>
              creator
                ? {
                    id: creator.id,
                    firstName: creator.firstName,
                    lastName: creator.lastName,
                  }
                : undefined,
          },
        },
      },
    );
  }

  async create(
    createDto: CreateStorageLocationDto,
    userId: string,
  ): Promise<StorageLocationDto> {
    const existing = await this.prisma.storageLocation.findUnique({
      where: { code: createDto.code },
    });
    if (existing) {
      this.errorHandler.throwConflictCustom(
        `Storage Location with code ${createDto.code} already exists`,
      );
    }

    if (createDto.areaId) {
      const area = await this.prisma.area.findUnique({
        where: { id: createDto.areaId },
      });
      this.errorHandler.throwIfNotFoundById('Area', createDto.areaId, area);
    }

    const item = await this.prisma.storageLocation.create({
      data: { ...createDto, createdBy: userId },
      include: { area: true, creator: true },
    });
    return this.storageLocationMapper(item);
  }

  async findAll(options?: FindAllOptions): Promise<{
    data: StorageLocationDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc',
      isActive,
      search,
      areaId,
    } = options || {};
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive;
    if (areaId) where.areaId = areaId;

    const [items, total] = await Promise.all([
      this.prisma.storageLocation.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: { area: true, creator: true },
      }),
      this.prisma.storageLocation.count({ where }),
    ]);

    return {
      data: items.map(this.storageLocationMapper),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<StorageLocationDto> {
    const item = await this.prisma.storageLocation.findUnique({
      where: { id },
      include: { area: true, creator: true },
    });
    this.errorHandler.throwIfNotFoundById('Storage Location', id, item);
    return this.storageLocationMapper(item);
  }

  async update(
    id: string,
    updateDto: UpdateStorageLocationDto,
  ): Promise<StorageLocationDto> {
    const existing = await this.prisma.storageLocation.findUnique({
      where: { id },
    });
    this.errorHandler.throwIfNotFoundById('Storage Location', id, existing);

    if (updateDto.code && updateDto.code !== existing.code) {
      const existingByCode = await this.prisma.storageLocation.findUnique({
        where: { code: updateDto.code },
      });
      if (existingByCode) {
        this.errorHandler.throwConflictCustom(
          `Storage Location with code ${updateDto.code} already exists`,
        );
      }
    }

    if (updateDto.areaId && updateDto.areaId !== existing.areaId) {
      const area = await this.prisma.area.findUnique({
        where: { id: updateDto.areaId },
      });
      this.errorHandler.throwIfNotFoundById('Area', updateDto.areaId, area);
    }

    const updated = await this.prisma.storageLocation.update({
      where: { id },
      data: updateDto,
      include: { area: true, creator: true },
    });
    return this.storageLocationMapper(updated);
  }

  async remove(id: string): Promise<void> {
    const item = await this.prisma.storageLocation.findUnique({
      where: { id },
      include: { weightReports: true },
    });
    this.errorHandler.throwIfNotFoundById('Storage Location', id, item);
    if (item.weightReports.length > 0) {
      this.errorHandler.throwConflictCustom(
        `Cannot delete Storage Location with associated weight reports`,
      );
    }
    await this.prisma.storageLocation.delete({ where: { id } });
  }
}
