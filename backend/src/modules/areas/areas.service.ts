import { ConflictException, Injectable } from '@nestjs/common';
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
  name?: string;
  code?: string;
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
    const existing = await this.prisma.area.findFirst({
      where: {
        code: createAreaDto.code,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('areas code already exist');
    }

    const area = await this.errorHandler.safeExecute(
      () =>
        this.prisma.area.create({
          data: createAreaDto,
          include: {
            office: true,
          },
        }),
      'creating area',
    );

    return this.areaMapper(area);
  }

  async findAll(options?: FindAllOptions): Promise<{
    data: AreaDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
      search,
      name,
      code,
      hasRoom,
    } = options || {};

    const where: Prisma.AreaWhereInput = {
      deletedAt: null,
    };

    const and: Prisma.AreaWhereInput[] = [];

    if (search) {
      and.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (name) {
      and.push({ name: { contains: name, mode: 'insensitive' } });
    }

    if (code) {
      and.push({ code: { contains: code, mode: 'insensitive' } });
    }

    if (isActive !== undefined) {
      and.push({ isActive });
    }

    // Filter by whether area has a room assigned
    if (hasRoom !== undefined) {
      if (hasRoom) {
        and.push({ rooms: { some: { deletedAt: null } } });
      } else {
        and.push({ rooms: { none: { deletedAt: null } } });
      }
    }

    if (and.length > 0) {
      where.AND = and;
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

    if (updateAreaDto.code) {
      const existingByCode = await this.prisma.area.findFirst({
        where: {
          code: updateAreaDto.code,
          deletedAt: null,
          id: { not: id },
        },
        select: { id: true },
      });
      if (existingByCode) {
        throw new ConflictException('areas code already exist');
      }
    }

    const area = await this.errorHandler.safeExecute(
      () =>
        this.prisma.area.update({
          where: { id },
          data: updateAreaDto,
          include: {
            office: true,
          },
        }),
      'updating area',
    );

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
