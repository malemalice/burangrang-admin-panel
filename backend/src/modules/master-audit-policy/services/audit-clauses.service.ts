import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateAuditClauseDto } from '../dto/create-audit-clause.dto';
import { UpdateAuditClauseDto } from '../dto/update-audit-clause.dto';
import { AuditClauseDto } from '../dto/audit-clause.dto';
import { Prisma } from '@prisma/client';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
  auditElementId?: string;
}

@Injectable()
export class AuditClausesService {
  private auditClauseMapper: (clause: any) => AuditClauseDto;
  private auditClauseArrayMapper: (clauses: any[]) => AuditClauseDto[];
  private auditClausePaginatedMapper: (data: { data: any[]; meta: any }) => {
    data: AuditClauseDto[];
    meta: any;
  };

  constructor(
    private prisma: PrismaService,
    private errorHandler: ErrorHandlingService,
    private dtoMapper: DtoMapperService,
  ) {
    this.auditClauseMapper = this.dtoMapper.createSimpleMapper(AuditClauseDto);
    this.auditClauseArrayMapper = this.dtoMapper.createSimpleArrayMapper(AuditClauseDto);
    this.auditClausePaginatedMapper = this.dtoMapper.createPaginatedMapper(AuditClauseDto);
  }

  async create(
    createAuditClauseDto: CreateAuditClauseDto,
  ): Promise<AuditClauseDto> {
    // Verify audit element exists
    const auditElement = await this.prisma.auditElement.findUnique({
      where: { id: createAuditClauseDto.auditElementId },
    });

    this.errorHandler.throwIfNotFoundById(
      'AuditElement',
      createAuditClauseDto.auditElementId,
      auditElement,
    );

    const data: Prisma.AuditClauseCreateInput = {
      name: createAuditClauseDto.name,
      code: createAuditClauseDto.code,
      description: createAuditClauseDto.description,
      order: createAuditClauseDto.order,
      isActive: createAuditClauseDto.isActive ?? true,
      auditElement: {
        connect: { id: createAuditClauseDto.auditElementId },
      },
    };

    const clause = await this.prisma.auditClause.create({
      data,
    });

    return this.auditClauseMapper(clause);
  }

  async findAll(options?: FindAllOptions): Promise<{
    data: AuditClauseDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'order',
      sortOrder = 'asc',
      isActive,
      search,
      auditElementId,
    } = options || {};

    const where: Prisma.AuditClauseWhereInput = {};

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

    if (auditElementId) {
      where.auditElementId = auditElementId;
    }

    const orderBy: Prisma.AuditClauseOrderByWithRelationInput = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'asc';
    } else {
      orderBy.order = 'asc';
    }

    const total = await this.prisma.auditClause.count({ where });

    const clauses = await this.prisma.auditClause.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    return this.auditClausePaginatedMapper({
      data: clauses,
      meta: { total, page, limit },
    });
  }

  async findOne(id: string): Promise<AuditClauseDto> {
    const clause = await this.prisma.auditClause.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('AuditClause', id, clause);

    return this.auditClauseMapper(clause);
  }

  async update(
    id: string,
    updateAuditClauseDto: UpdateAuditClauseDto,
  ): Promise<AuditClauseDto> {
    const existingClause = await this.prisma.auditClause.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('AuditClause', id, existingClause);

    // If auditElementId is being updated, verify it exists
    if (updateAuditClauseDto.auditElementId !== undefined) {
      const auditElement = await this.prisma.auditElement.findUnique({
        where: { id: updateAuditClauseDto.auditElementId },
      });

      this.errorHandler.throwIfNotFoundById(
        'AuditElement',
        updateAuditClauseDto.auditElementId,
        auditElement,
      );
    }

    const updateData: Prisma.AuditClauseUpdateInput = {};

    if (updateAuditClauseDto.name !== undefined) {
      updateData.name = updateAuditClauseDto.name;
    }
    if (updateAuditClauseDto.code !== undefined) {
      updateData.code = updateAuditClauseDto.code;
    }
    if (updateAuditClauseDto.description !== undefined) {
      updateData.description = updateAuditClauseDto.description;
    }
    if (updateAuditClauseDto.order !== undefined) {
      updateData.order = updateAuditClauseDto.order;
    }
    if (updateAuditClauseDto.isActive !== undefined) {
      updateData.isActive = updateAuditClauseDto.isActive;
    }
    if (updateAuditClauseDto.auditElementId !== undefined) {
      updateData.auditElement = {
        connect: { id: updateAuditClauseDto.auditElementId },
      };
    }

    const clause = await this.prisma.auditClause.update({
      where: { id },
      data: updateData,
    });

    return this.auditClauseMapper(clause);
  }

  async remove(id: string): Promise<void> {
    const existingClause = await this.prisma.auditClause.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('AuditClause', id, existingClause);

    await this.prisma.auditClause.delete({
      where: { id },
    });
  }

  async findByCode(code: string): Promise<AuditClauseDto> {
    const clause = await this.prisma.auditClause.findUnique({
      where: { code },
    });

    this.errorHandler.throwIfNotFoundByField('AuditClause', 'code', code, clause);

    return this.auditClauseMapper(clause);
  }
}
