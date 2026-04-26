import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { AreaDto } from './dto/area.dto';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { Prisma } from '@prisma/client';
import { buildSoftDeleteDataWithInactive } from '../../shared/utils/soft-delete.util';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
  hasRoom?: boolean; // Filter areas by whether they have a room assigned
}

@Injectable()
export class AreasService {
  private areaMapper: (area: any) => AreaDto;
  private areaPaginatedMapper: (data: { data: any[]; meta: any }) => { data: AreaDto[]; meta: any };

  constructor(
    private readonly prisma: PrismaService,
    private dtoMapper: DtoMapperService,
    private errorHandler: ErrorHandlingService,
  ) {
    // Initialize mappers with office relation
    this.areaMapper = this.dtoMapper.createRelationMapper(
      AreaDto,
      {
        office: {
          mapper: (office: any) => office ? {
            id: office.id,
            name: office.name,
            code: office.code,
          } : null,
          isArray: false,
        },
      },
      [],
    );

    this.areaPaginatedMapper = this.dtoMapper.createPaginatedMapper(AreaDto, {
      relations: {
        office: {
          mapper: (office: any) => office ? {
            id: office.id,
            name: office.name,
            code: office.code,
          } : null,
          isArray: false,
        },
      },
    });
  }

  async create(createAreaDto: CreateAreaDto): Promise<AreaDto> {
    const area = await this.prisma.area.create({
      data: createAreaDto,
      include: {
        office: true,
      },
    });

    return this.areaMapper(area);
  }

  async findAll(options?: FindAllOptions): Promise<{
    data: AreaDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc',
      isActive,
      search,
      hasRoom,
    } = options || {};

    const where: Prisma.AreaWhereInput = {
      deletedAt: null,
    };

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

    // Filter by whether area has a room assigned
    if (hasRoom !== undefined) {
      if (hasRoom) {
        where.rooms = { some: {} };
      } else {
        where.rooms = { none: {} };
      }
    }

    const [areas, total] = await Promise.all([
      this.prisma.area.findMany({
        where,
        include: {
          office: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.area.count({ where }),
    ]);

    return this.areaPaginatedMapper({
      data: areas,
      meta: { total, page, limit },
    });
  }

  async findOne(id: string): Promise<AreaDto> {
    const area = await this.prisma.area.findFirst({
      where: { id, deletedAt: null },
      include: {
        office: true,
      },
    });

    this.errorHandler.throwIfNotFoundById('Area', id, area);

    return this.areaMapper(area);
  }

  async update(id: string, updateAreaDto: UpdateAreaDto): Promise<AreaDto> {
    const existingArea = await this.prisma.area.findFirst({
      where: { id, deletedAt: null },
    });

    this.errorHandler.throwIfNotFoundById('Area', id, existingArea);

    const area = await this.prisma.area.update({
      where: { id },
      data: updateAreaDto,
      include: {
        office: true,
      },
    });

    return this.areaMapper(area);
  }

  async remove(id: string, deletedBy: string): Promise<void> {
    const area = await this.prisma.area.findFirst({
      where: { id, deletedAt: null },
      include: {
        rooms: { where: { deletedAt: null } },
      },
    });

    this.errorHandler.throwIfNotFoundById('Area', id, area);

    if (area.rooms.length > 0) {
      this.errorHandler.throwConflictCustom(`Cannot delete area with ID ${id} because it has associated rooms`);
    }

    await this.prisma.area.update({
      where: { id },
      data: buildSoftDeleteDataWithInactive(deletedBy),
    });
  }
}
