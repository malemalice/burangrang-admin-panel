import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateAuditCriteriaDto } from '../dto/create-audit-criteria.dto';
import { UpdateAuditCriteriaDto } from '../dto/update-audit-criteria.dto';
import { AuditCriteriaDto } from '../dto/audit-criteria.dto';
import { Prisma, TransitionTypeEnum } from '@prisma/client';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
  auditClauseId?: string;
  transitionType?: TransitionTypeEnum;
}

@Injectable()
export class AuditCriteriaService {
  private auditCriteriaMapper: (criteria: any) => AuditCriteriaDto;
  private auditCriteriaArrayMapper: (criterias: any[]) => AuditCriteriaDto[];
  private auditCriteriaPaginatedMapper: (data: { data: any[]; meta: any }) => {
    data: AuditCriteriaDto[];
    meta: any;
  };

  constructor(
    private prisma: PrismaService,
    private errorHandler: ErrorHandlingService,
    private dtoMapper: DtoMapperService,
  ) {
    this.auditCriteriaMapper = this.dtoMapper.createSimpleMapper(AuditCriteriaDto);
    this.auditCriteriaArrayMapper = this.dtoMapper.createSimpleArrayMapper(AuditCriteriaDto);
    this.auditCriteriaPaginatedMapper = this.dtoMapper.createPaginatedMapper(AuditCriteriaDto);
  }

  async create(
    createAuditCriteriaDto: CreateAuditCriteriaDto,
  ): Promise<AuditCriteriaDto> {
    // Verify audit clause exists
    const auditClause = await this.prisma.auditClause.findUnique({
      where: { id: createAuditCriteriaDto.auditClauseId },
    });

    this.errorHandler.throwIfNotFoundById(
      'AuditClause',
      createAuditCriteriaDto.auditClauseId,
      auditClause,
    );

    const data: Prisma.AuditCriteriaCreateInput = {
      name: createAuditCriteriaDto.name,
      code: createAuditCriteriaDto.code,
      description: createAuditCriteriaDto.description,
      transitionType: createAuditCriteriaDto.transitionType,
      order: createAuditCriteriaDto.order,
      isActive: createAuditCriteriaDto.isActive ?? true,
      auditClause: {
        connect: { id: createAuditCriteriaDto.auditClauseId },
      },
    };

    const criteria = await this.prisma.auditCriteria.create({
      data,
    });

    return this.auditCriteriaMapper(criteria);
  }

  async findAll(options?: FindAllOptions): Promise<{
    data: AuditCriteriaDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'order',
      sortOrder = 'asc',
      isActive,
      search,
      auditClauseId,
      transitionType,
    } = options || {};

    const where: Prisma.AuditCriteriaWhereInput = {};

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

    if (auditClauseId) {
      where.auditClauseId = auditClauseId;
    }

    if (transitionType) {
      where.transitionType = transitionType;
    }

    const orderBy: Prisma.AuditCriteriaOrderByWithRelationInput = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'asc';
    } else {
      orderBy.order = 'asc';
    }

    const total = await this.prisma.auditCriteria.count({ where });

    const criterias = await this.prisma.auditCriteria.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    return this.auditCriteriaPaginatedMapper({
      data: criterias,
      meta: { total, page, limit },
    });
  }

  async findOne(id: string): Promise<AuditCriteriaDto> {
    const criteria = await this.prisma.auditCriteria.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('AuditCriteria', id, criteria);

    return this.auditCriteriaMapper(criteria);
  }

  async update(
    id: string,
    updateAuditCriteriaDto: UpdateAuditCriteriaDto,
  ): Promise<AuditCriteriaDto> {
    const existingCriteria = await this.prisma.auditCriteria.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('AuditCriteria', id, existingCriteria);

    // If auditClauseId is being updated, verify it exists
    if (updateAuditCriteriaDto.auditClauseId !== undefined) {
      const auditClause = await this.prisma.auditClause.findUnique({
        where: { id: updateAuditCriteriaDto.auditClauseId },
      });

      this.errorHandler.throwIfNotFoundById(
        'AuditClause',
        updateAuditCriteriaDto.auditClauseId,
        auditClause,
      );
    }

    const updateData: Prisma.AuditCriteriaUpdateInput = {};

    if (updateAuditCriteriaDto.name !== undefined) {
      updateData.name = updateAuditCriteriaDto.name;
    }
    if (updateAuditCriteriaDto.code !== undefined) {
      updateData.code = updateAuditCriteriaDto.code;
    }
    if (updateAuditCriteriaDto.description !== undefined) {
      updateData.description = updateAuditCriteriaDto.description;
    }
    if (updateAuditCriteriaDto.transitionType !== undefined) {
      updateData.transitionType = updateAuditCriteriaDto.transitionType;
    }
    if (updateAuditCriteriaDto.order !== undefined) {
      updateData.order = updateAuditCriteriaDto.order;
    }
    if (updateAuditCriteriaDto.isActive !== undefined) {
      updateData.isActive = updateAuditCriteriaDto.isActive;
    }
    if (updateAuditCriteriaDto.auditClauseId !== undefined) {
      updateData.auditClause = {
        connect: { id: updateAuditCriteriaDto.auditClauseId },
      };
    }

    const criteria = await this.prisma.auditCriteria.update({
      where: { id },
      data: updateData,
    });

    return this.auditCriteriaMapper(criteria);
  }

  async remove(id: string): Promise<void> {
    const existingCriteria = await this.prisma.auditCriteria.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('AuditCriteria', id, existingCriteria);

    await this.prisma.auditCriteria.delete({
      where: { id },
    });
  }

  async findByCode(code: string): Promise<AuditCriteriaDto> {
    const criteria = await this.prisma.auditCriteria.findUnique({
      where: { code },
    });

    this.errorHandler.throwIfNotFoundByField('AuditCriteria', 'code', code, criteria);

    return this.auditCriteriaMapper(criteria);
  }
}
