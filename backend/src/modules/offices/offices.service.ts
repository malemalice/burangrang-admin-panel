import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateOfficeDto } from './dto/create-office.dto';
import { UpdateOfficeDto } from './dto/update-office.dto';
import { OfficeDto } from './dto/office.dto';
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
  address?: string;
}

@Injectable()
export class OfficesService {
  private officeMapper: (office: any) => OfficeDto;
  private officeArrayMapper: (offices: any[]) => OfficeDto[];
  private officePaginatedMapper: (data: { data: any[]; meta: any }) => { data: OfficeDto[]; meta: any };

  constructor(
    private readonly prisma: PrismaService,
    private dtoMapper: DtoMapperService,
    private errorHandler: ErrorHandlingService,
  ) {
    // Initialize mappers with recursive parent/child relationships
    this.officeMapper = this.dtoMapper.createRelationMapper(
      OfficeDto,
      {
        parent: {
          mapper: (parent: any) => this.officeMapper(parent),
          isArray: false,
        },
        children: {
          mapper: (child: any) => this.officeMapper(child),
          isArray: true,
        },
      },
      [], // no exclusions
    );

    this.officeArrayMapper = this.dtoMapper.createArrayMapper(OfficeDto, {
      relations: {
        parent: {
          mapper: (parent: any) => this.officeMapper(parent),
          isArray: false,
        },
        children: {
          mapper: (child: any) => this.officeMapper(child),
          isArray: true,
        },
      },
    });

    this.officePaginatedMapper = this.dtoMapper.createPaginatedMapper(OfficeDto, {
      relations: {
        parent: {
          mapper: (parent: any) => this.officeMapper(parent),
          isArray: false,
        },
        children: {
          mapper: (child: any) => this.officeMapper(child),
          isArray: true,
        },
      },
    });
  }

  async create(createOfficeDto: CreateOfficeDto): Promise<OfficeDto> {
    const { parentId, ...data } = createOfficeDto;

    const existing = await this.prisma.office.findFirst({
      where: {
        code: data.code,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('office code already exist');
    }

    const office = await this.errorHandler.safeExecute(
      () =>
        this.prisma.office.create({
          data: {
            ...data,
            ...(parentId && {
              parent: {
                connect: { id: parentId },
              },
            }),
          },
          include: {
            children: true,
            parent: true,
          },
        }),
      'creating office',
    );

    return this.officeMapper(office);
  }

  async findAll(options?: FindAllOptions): Promise<{
    data: OfficeDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc',
      isActive,
      search,
      name,
      code,
      address,
    } = options || {};

    const where: Prisma.OfficeWhereInput = {
      deletedAt: null,
    };
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    }
    if (code) {
      where.code = { contains: code, mode: 'insensitive' };
    }
    if (address) {
      where.address = { contains: address, mode: 'insensitive' };
    }
    if (search) {
      // Search is scoped to name only (per QA expectation)
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [offices, total] = await Promise.all([
      this.prisma.office.findMany({
        where,
        include: {
          children: true,
          parent: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.office.count({ where }),
    ]);

    return this.officePaginatedMapper({
      data: offices,
      meta: { total, page, limit },
    });
  }

  async findOne(id: string): Promise<OfficeDto> {
    const office = await this.prisma.office.findFirst({
      where: { id, deletedAt: null },
      include: {
        children: true,
        parent: true,
      },
    });

    this.errorHandler.throwIfNotFoundById('Office', id, office);

    return this.officeMapper(office);
  }

  async update(
    id: string,
    updateOfficeDto: UpdateOfficeDto,
  ): Promise<OfficeDto> {
    const existingOffice = await this.prisma.office.findFirst({
      where: { id, deletedAt: null },
    });

    this.errorHandler.throwIfNotFoundById('Office', id, existingOffice);

    const { parentId, ...data } = updateOfficeDto;
    if (data.code) {
      const existingByCode = await this.prisma.office.findFirst({
        where: {
          code: data.code,
          deletedAt: null,
          id: { not: id },
        },
        select: { id: true },
      });
      if (existingByCode) {
        throw new ConflictException('office code already exist');
      }
    }

    const office = await this.errorHandler.safeExecute(
      () =>
        this.prisma.office.update({
          where: { id },
          data: {
            ...data,
            ...(parentId !== undefined && {
              parent: parentId
                ? { connect: { id: parentId } }
                : { disconnect: true },
            }),
          },
          include: {
            children: true,
            parent: true,
          },
        }),
      'updating office',
    );

    return this.officeMapper(office);
  }

  async remove(id: string, deletedBy: string): Promise<void> {
    const office = await this.prisma.office.findFirst({
      where: { id, deletedAt: null },
    });

    this.errorHandler.throwIfNotFoundById('Office', id, office);

    await this.prisma.office.update({
      where: { id },
      data: buildSoftDeleteDataWithInactive(deletedBy),
    });
  }

  async getOfficeHierarchy(): Promise<OfficeDto[]> {
    const offices = await this.prisma.office.findMany({
      where: {
        parentId: null,
        deletedAt: null,
      },
      include: {
        children: {
          include: {
            children: true,
          },
        },
      },
    });

    return this.officeArrayMapper(offices);
  }

}
