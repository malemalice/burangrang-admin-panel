import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { buildSoftDeleteDataWithInactive } from '../../shared/utils/soft-delete.util';
import { Prisma } from '@prisma/client';
import { InspectionChecklistDto } from './dto/inspection-checklist.dto';
import { CreateInspectionChecklistDto } from './dto/create-inspection-checklist.dto';
import { UpdateInspectionChecklistDto } from './dto/update-inspection-checklist.dto';

export interface FindInspectionChecklistsOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  isActive?: boolean;
  rootsOnly?: boolean;
}

@Injectable()
export class InspectionChecklistsService {
  private checklistMapper: (item: any) => InspectionChecklistDto;
  private checklistPaginatedMapper: (data: { data: any[]; meta: any }) => { data: InspectionChecklistDto[]; meta: any };

  constructor(
    private prisma: PrismaService,
    private dtoMapper: DtoMapperService,
    private errorHandler: ErrorHandlingService,
  ) {
    this.checklistMapper = this.dtoMapper.createRelationMapper(
      InspectionChecklistDto,
      {
        parent: {
          mapper: (parent: any) => this.checklistMapper(parent),
          isArray: false,
        },
        children: {
          mapper: (child: any) => this.checklistMapper(child),
          isArray: true,
        },
      },
    );

    this.checklistPaginatedMapper = this.dtoMapper.createPaginatedMapper(InspectionChecklistDto);
  }

  async create(dto: CreateInspectionChecklistDto): Promise<InspectionChecklistDto> {
    if (dto.parentId) {
      const parent = await this.prisma.inspectionChecklist.findFirst({
        where: { id: dto.parentId, deletedAt: null },
        include: { children: { where: { deletedAt: null }, take: 1 } },
      });

      this.errorHandler.throwIfNotFoundById('Parent checklist item', dto.parentId, parent);

      const depth = await this.getDepth(dto.parentId);
      if (depth >= 2) {
        throw new BadRequestException('Cannot nest deeper than 2 levels (template → category → leaf item)');
      }
    }

    const record = await this.prisma.inspectionChecklist.create({
      data: {
        name: dto.name,
        parentId: dto.parentId ?? null,
        code: dto.code ?? null,
        description: dto.description ?? null,
        order: dto.order ?? 0,
        isActive: dto.isActive ?? true,
      },
      include: {
        parent: true,
        children: { orderBy: { order: 'asc' } },
      },
    });

    return this.checklistMapper(record);
  }

  async findAll(options?: FindInspectionChecklistsOptions): Promise<{
    data: InspectionChecklistDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'order',
      sortOrder = 'asc',
      search,
      isActive,
      rootsOnly = false,
    } = options || {};

    const where: Prisma.InspectionChecklistWhereInput = {
      deletedAt: null,
    };

    if (rootsOnly) {
      where.parentId = null;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search?.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { code: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const total = await this.prisma.inspectionChecklist.count({ where });

    const validSortFields = ['name', 'code', 'order', 'isActive', 'createdAt'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'order';
    const orderBy: Prisma.InspectionChecklistOrderByWithRelationInput = { [orderField]: sortOrder };

    const records = await this.prisma.inspectionChecklist.findMany({
      where,
      include: {
        parent: true,
        children: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    return this.checklistPaginatedMapper({
      data: records,
      meta: { total, page, limit },
    });
  }

  async findTree(): Promise<InspectionChecklistDto[]> {
    const roots = await this.prisma.inspectionChecklist.findMany({
      where: { parentId: null, deletedAt: null, isActive: true },
      include: {
        children: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
          include: {
            children: {
              where: { deletedAt: null },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    return roots.map((r) => this.checklistMapper(r));
  }

  async findOne(id: string): Promise<InspectionChecklistDto> {
    const record = await this.prisma.inspectionChecklist.findFirst({
      where: { id, deletedAt: null },
      include: {
        parent: true,
        children: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
          include: {
            children: {
              where: { deletedAt: null },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    this.errorHandler.throwIfNotFoundById('Inspection checklist', id, record);

    return this.checklistMapper(record);
  }

  async update(id: string, dto: UpdateInspectionChecklistDto): Promise<InspectionChecklistDto> {
    const existing = await this.prisma.inspectionChecklist.findFirst({
      where: { id, deletedAt: null },
    });

    this.errorHandler.throwIfNotFoundById('Inspection checklist', id, existing);

    if (dto.parentId !== undefined && dto.parentId !== existing.parentId) {
      if (dto.parentId === null) {
        // Moving to root is only allowed if already root — prevent promoting children
        if (existing.parentId !== null) {
          throw new BadRequestException('Cannot promote a non-root item to template root');
        }
      } else {
        const depth = await this.getDepth(dto.parentId);
        if (depth >= 2) {
          throw new BadRequestException('Cannot nest deeper than 2 levels');
        }
      }
    }

    const record = await this.prisma.inspectionChecklist.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        order: dto.order,
        isActive: dto.isActive,
      },
      include: {
        parent: true,
        children: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
        },
      },
    });

    return this.checklistMapper(record);
  }

  async remove(id: string, deletedBy: string): Promise<void> {
    const existing = await this.prisma.inspectionChecklist.findFirst({
      where: { id, deletedAt: null },
      include: { children: { where: { deletedAt: null }, take: 1 } },
    });

    this.errorHandler.throwIfNotFoundById('Inspection checklist', id, existing);

    if (existing.children?.length > 0) {
      throw new BadRequestException('Cannot delete an item that has child items. Remove children first.');
    }

    await this.prisma.inspectionChecklist.update({
      where: { id },
      data: buildSoftDeleteDataWithInactive(deletedBy),
    });
  }

  private async getDepth(id: string): Promise<number> {
    let depth = 0;
    let currentId: string | null = id;

    while (currentId) {
      const record = await this.prisma.inspectionChecklist.findFirst({
        where: { id: currentId },
        select: { parentId: true },
      });
      if (!record || !record.parentId) break;
      currentId = record.parentId;
      depth++;
    }

    return depth;
  }
}
