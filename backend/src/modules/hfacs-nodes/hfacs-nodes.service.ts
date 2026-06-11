import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, InvestigationCauseSectionEnum } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { buildSoftDeleteDataWithInactive } from '../../shared/utils/soft-delete.util';
import { HfacsNodeDto } from './dto/hfacs-node.dto';
import { CreateHfacsNodeDto } from './dto/create-hfacs-node.dto';
import { UpdateHfacsNodeDto } from './dto/update-hfacs-node.dto';

export interface FindHfacsNodesOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  section?: InvestigationCauseSectionEnum;
  depth?: number;
  parentId?: string | null;
  isActive?: boolean;
}

@Injectable()
export class HfacsNodesService {
  private nodeMapper: (item: any) => HfacsNodeDto;
  private paginatedMapper: (data: { data: any[]; meta: any }) => {
    data: HfacsNodeDto[];
    meta: any;
  };

  constructor(
    private prisma: PrismaService,
    private dtoMapper: DtoMapperService,
    private errorHandler: ErrorHandlingService,
  ) {
    this.nodeMapper = this.dtoMapper.createRelationMapper(HfacsNodeDto, {
      parent: {
        mapper: (parent: any) => this.nodeMapper(parent),
        isArray: false,
      },
      children: {
        mapper: (child: any) => this.nodeMapper(child),
        isArray: true,
      },
    });

    this.paginatedMapper = this.dtoMapper.createPaginatedMapper(HfacsNodeDto);
  }

  async create(dto: CreateHfacsNodeDto): Promise<HfacsNodeDto> {
    const depth = await this.resolveDepthForCreate(dto.parentId, dto.section);

    if (dto.code) {
      const codeConflict = await this.prisma.hfacsNode.findFirst({
        where: { code: dto.code, deletedAt: null },
      });
      if (codeConflict) {
        throw new BadRequestException(
          `Code "${dto.code}" is already used by another HFACS node`,
        );
      }
    }

    const record = await this.prisma.hfacsNode.create({
      data: {
        parentId: dto.parentId ?? null,
        section: dto.section,
        depth,
        code: dto.code ?? null,
        labelEn: dto.labelEn,
        labelId: dto.labelId,
        isOther: dto.isOther ?? false,
        order: dto.order ?? 0,
        isActive: dto.isActive ?? true,
      },
      include: {
        parent: true,
        children: { where: { deletedAt: null }, orderBy: { order: 'asc' } },
      },
    });

    return this.nodeMapper(record);
  }

  async findAll(options?: FindHfacsNodesOptions): Promise<{
    data: HfacsNodeDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'order',
      sortOrder = 'asc',
      search,
      section,
      depth,
      parentId,
      isActive,
    } = options || {};

    const where: Prisma.HfacsNodeWhereInput = { deletedAt: null };

    if (section) where.section = section;
    if (depth !== undefined) where.depth = depth;
    if (parentId !== undefined) where.parentId = parentId;
    if (isActive !== undefined) where.isActive = isActive;

    if (search?.trim()) {
      where.OR = [
        { labelEn: { contains: search.trim(), mode: 'insensitive' } },
        { labelId: { contains: search.trim(), mode: 'insensitive' } },
        { code: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const total = await this.prisma.hfacsNode.count({ where });

    const validSortFields = ['labelEn', 'labelId', 'code', 'order', 'depth', 'isActive', 'createdAt'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'order';
    const orderBy: Prisma.HfacsNodeOrderByWithRelationInput = {
      [orderField]: sortOrder,
    };

    const records = await this.prisma.hfacsNode.findMany({
      where,
      include: {
        parent: true,
        children: { where: { deletedAt: null }, orderBy: { order: 'asc' } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    return this.paginatedMapper({
      data: records,
      meta: { total, page, limit },
    });
  }

  async findTree(includeInactive = false): Promise<HfacsNodeDto[]> {
    const activeFilter = includeInactive ? {} : { isActive: true };
    const roots = await this.prisma.hfacsNode.findMany({
      where: { parentId: null, deletedAt: null, ...activeFilter },
      include: {
        children: {
          where: { deletedAt: null, ...activeFilter },
          orderBy: { order: 'asc' },
          include: {
            children: {
              where: { deletedAt: null, ...activeFilter },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
      orderBy: [{ section: 'asc' }, { order: 'asc' }],
    });

    return roots.map((r) => this.nodeMapper(r));
  }

  async findOne(id: string): Promise<HfacsNodeDto> {
    const record = await this.prisma.hfacsNode.findFirst({
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

    this.errorHandler.throwIfNotFoundById('HFACS node', id, record);

    return this.nodeMapper(record);
  }

  async update(id: string, dto: UpdateHfacsNodeDto): Promise<HfacsNodeDto> {
    const existing = await this.prisma.hfacsNode.findFirst({
      where: { id, deletedAt: null },
    });

    this.errorHandler.throwIfNotFoundById('HFACS node', id, existing);

    if (dto.code !== undefined && dto.code !== null && dto.code !== existing.code) {
      const codeConflict = await this.prisma.hfacsNode.findFirst({
        where: { code: dto.code, deletedAt: null, NOT: { id } },
      });
      if (codeConflict) {
        throw new BadRequestException(
          `Code "${dto.code}" is already used by another HFACS node`,
        );
      }
    }

    // Moving across the tree (changing parentId) is intentionally not supported here —
    // it would silently invalidate the snapshot fields already stored on historical
    // investigation reports. If clients need to restructure, soft-delete + recreate.
    if (dto.parentId !== undefined && dto.parentId !== existing.parentId) {
      throw new BadRequestException(
        'Reparenting an HFACS node is not allowed. Soft-delete it and create a new node under the desired parent instead.',
      );
    }

    if (dto.section !== undefined && dto.section !== existing.section) {
      throw new BadRequestException(
        'Changing an HFACS node section is not allowed. Soft-delete it and create a new node under the desired section instead.',
      );
    }

    const record = await this.prisma.hfacsNode.update({
      where: { id },
      data: {
        code: dto.code,
        labelEn: dto.labelEn,
        labelId: dto.labelId,
        isOther: dto.isOther,
        order: dto.order,
        isActive: dto.isActive,
      },
      include: {
        parent: true,
        children: { where: { deletedAt: null }, orderBy: { order: 'asc' } },
      },
    });

    return this.nodeMapper(record);
  }

  async remove(id: string, deletedBy: string): Promise<void> {
    const existing = await this.prisma.hfacsNode.findFirst({
      where: { id, deletedAt: null },
      include: { children: { where: { deletedAt: null }, take: 1 } },
    });

    this.errorHandler.throwIfNotFoundById('HFACS node', id, existing);

    if (existing.children?.length > 0) {
      throw new BadRequestException(
        'Cannot delete an HFACS node that has active children. Remove children first.',
      );
    }

    await this.prisma.hfacsNode.update({
      where: { id },
      data: buildSoftDeleteDataWithInactive(deletedBy),
    });
  }

  private async resolveDepthForCreate(
    parentId: string | undefined,
    section: InvestigationCauseSectionEnum,
  ): Promise<number> {
    if (!parentId) return 0;

    const parent = await this.prisma.hfacsNode.findFirst({
      where: { id: parentId, deletedAt: null },
    });

    this.errorHandler.throwIfNotFoundById('Parent HFACS node', parentId, parent);

    if (parent.section !== section) {
      throw new BadRequestException(
        `Parent section (${parent.section}) does not match new node section (${section}).`,
      );
    }

    if (parent.depth >= 2) {
      throw new BadRequestException(
        'Cannot nest deeper than 3 levels (Tier1 → Tier2 → Item).',
      );
    }

    return parent.depth + 1;
  }
}
