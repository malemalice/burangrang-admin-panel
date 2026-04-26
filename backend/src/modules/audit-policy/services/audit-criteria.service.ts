import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateAuditCriteriaDto } from '../dto/create-audit-criteria.dto';
import { UpdateAuditCriteriaDto } from '../dto/update-audit-criteria.dto';
import { AuditCriteriaDto } from '../dto/audit-criteria.dto';
import { Prisma, TransitionTypeEnum } from '@prisma/client';
import { PRISMA_ERROR_CODES } from '../../../shared/constants/prisma-errors';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';
import { buildSoftDeleteDataWithInactive, isNotDeleted } from '../../../shared/utils/soft-delete.util';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
  auditClauseId?: string;
  auditElementId?: string;
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

  /**
   * Generate criteria code based on clause code and criteria order
   */
  private generateCriteriaCode(clauseCode: string, order: number): string {
    return `${clauseCode}.${order + 1}`;
  }

  /**
   * Regenerate codes for all criteria in an audit clause.
   * Uses two-phase update to avoid unique constraint violations when reassigning codes.
   */
  async regenerateCriteriaCodes(auditClauseId: string): Promise<void> {
    const auditClause = await this.prisma.auditClause.findFirst({
      where: { id: auditClauseId, ...isNotDeleted },
      include: {
        auditElement: true,
      },
    });

    this.errorHandler.throwIfNotFoundById('AuditClause', auditClauseId, auditClause);

    const criteria = await this.prisma.auditCriteria.findMany({
      where: { auditClauseId, ...isNotDeleted },
      orderBy: { order: 'asc' },
    });

    await this.prisma.$transaction(async (tx) => {
      // Phase 1: set all codes to temporary values to avoid unique constraint during reassignment
      for (const criterion of criteria) {
        await tx.auditCriteria.update({
          where: { id: criterion.id },
          data: { code: `__temp_${criterion.id}` },
        });
      }
      // Phase 2: set final codes
      for (let i = 0; i < criteria.length; i++) {
        const newCriteriaCode = this.generateCriteriaCode(auditClause!.code, i);
        await tx.auditCriteria.update({
          where: { id: criteria[i].id },
          data: { code: newCriteriaCode },
        });
      }
    });
  }

  async create(
    createAuditCriteriaDto: CreateAuditCriteriaDto,
  ): Promise<AuditCriteriaDto> {
    // Verify audit clause exists
    const auditClause = await this.prisma.auditClause.findFirst({
      where: { id: createAuditCriteriaDto.auditClauseId, ...isNotDeleted },
      include: {
        auditElement: true,
      },
    });

    this.errorHandler.throwIfNotFoundById(
      'AuditClause',
      createAuditCriteriaDto.auditClauseId,
      auditClause,
    );

    // Check for duplicate order within the same clause
    const existingWithOrder = await this.prisma.auditCriteria.findFirst({
      where: {
        auditClauseId: createAuditCriteriaDto.auditClauseId,
        order: createAuditCriteriaDto.order,
        ...isNotDeleted,
      },
    });
    if (existingWithOrder) {
      this.errorHandler.throwConflictCustom('Order number already exists');
    }

    // Auto-generate code if not provided
    const code = createAuditCriteriaDto.code || this.generateCriteriaCode(
      auditClause.code,
      createAuditCriteriaDto.order,
    );

    const data: Prisma.AuditCriteriaCreateInput = {
      name: createAuditCriteriaDto.name,
      code,
      description: createAuditCriteriaDto.description,
      transitionType: createAuditCriteriaDto.transitionType,
      order: createAuditCriteriaDto.order,
      isActive: createAuditCriteriaDto.isActive ?? true,
      auditClause: {
        connect: { id: createAuditCriteriaDto.auditClauseId },
      },
    };

    let criteria;
    try {
      criteria = await this.prisma.auditCriteria.create({
        data,
      });
    } catch (error: any) {
      if (error?.code === PRISMA_ERROR_CODES.UNIQUE_VIOLATION) {
        this.errorHandler.throwConflictCustom('Order number already exists');
      }
      throw error;
    }

    // Regenerate all criteria codes to ensure consistency
    await this.regenerateCriteriaCodes(auditClause.id);

    // Return the updated criteria
    const updatedCriteria = await this.prisma.auditCriteria.findFirst({
      where: { id: criteria.id, ...isNotDeleted },
    });

    return this.auditCriteriaMapper(updatedCriteria);
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
      auditElementId,
      transitionType,
    } = options || {};

    const where: Prisma.AuditCriteriaWhereInput = { ...isNotDeleted };

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

    if (auditElementId) {
      where.auditClause = {
        is: { auditElementId, ...isNotDeleted },
      };
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
      include: {
        auditClause: {
          include: {
            auditElement: true,
          },
        },
      },
    });

    return this.auditCriteriaPaginatedMapper({
      data: criterias,
      meta: { total, page, limit },
    });
  }

  async findOne(id: string): Promise<AuditCriteriaDto> {
    const criteria = await this.prisma.auditCriteria.findFirst({
      where: { id, ...isNotDeleted },
      include: {
        auditClause: {
          include: {
            auditElement: true,
          },
        },
      },
    });

    this.errorHandler.throwIfNotFoundById('AuditCriteria', id, criteria);

    return this.auditCriteriaMapper(criteria);
  }

  async update(
    id: string,
    updateAuditCriteriaDto: UpdateAuditCriteriaDto,
  ): Promise<AuditCriteriaDto> {
    const existingCriteria = await this.prisma.auditCriteria.findFirst({
      where: { id, ...isNotDeleted },
      include: {
        auditClause: {
          include: {
            auditElement: true,
          },
        },
      },
    });

    this.errorHandler.throwIfNotFoundById('AuditCriteria', id, existingCriteria);

    // If auditClauseId is being updated, verify it exists
    let auditClauseId = existingCriteria.auditClauseId;
    if (updateAuditCriteriaDto.auditClauseId !== undefined) {
      const auditClause = await this.prisma.auditClause.findFirst({
        where: { id: updateAuditCriteriaDto.auditClauseId, ...isNotDeleted },
        include: {
          auditElement: true,
        },
      });

      this.errorHandler.throwIfNotFoundById(
        'AuditClause',
        updateAuditCriteriaDto.auditClauseId,
        auditClause,
      );
      auditClauseId = updateAuditCriteriaDto.auditClauseId;
    }

    const updateData: Prisma.AuditCriteriaUpdateInput = {};

    if (updateAuditCriteriaDto.name !== undefined) {
      updateData.name = updateAuditCriteriaDto.name;
    }
    // Don't allow manual code updates - it will be auto-generated
    if (updateAuditCriteriaDto.description !== undefined) {
      updateData.description = updateAuditCriteriaDto.description;
    }
    if (updateAuditCriteriaDto.transitionType !== undefined) {
      updateData.transitionType = updateAuditCriteriaDto.transitionType;
    }
    if (updateAuditCriteriaDto.order !== undefined) {
      // Check for duplicate order within the same clause (excluding current criteria)
      const existingWithOrder = await this.prisma.auditCriteria.findFirst({
        where: {
          auditClauseId,
          order: updateAuditCriteriaDto.order,
          id: { not: id },
          ...isNotDeleted,
        },
      });
      if (existingWithOrder) {
        this.errorHandler.throwConflictCustom('Order number already exists');
      }
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

    // Regenerate all criteria codes if order or clause changed
    if (updateAuditCriteriaDto.order !== undefined || updateAuditCriteriaDto.auditClauseId !== undefined) {
      await this.regenerateCriteriaCodes(auditClauseId);
      // Return updated criteria
      const updatedCriteria = await this.prisma.auditCriteria.findFirst({
        where: { id, ...isNotDeleted },
      });
      return this.auditCriteriaMapper(updatedCriteria);
    }

    return this.auditCriteriaMapper(criteria);
  }

  async remove(id: string, deletedBy?: string): Promise<void> {
    const existingCriteria = await this.prisma.auditCriteria.findFirst({
      where: { id, ...isNotDeleted },
    });

    this.errorHandler.throwIfNotFoundById('AuditCriteria', id, existingCriteria);

    const refCount = await this.prisma.auditItem.count({
      where: { auditCriteriaId: id },
    });
    if (refCount > 0) {
      this.errorHandler.throwConflictCustom(
        'Cannot delete audit criteria that are referenced by audit items.',
      );
    }

    await this.prisma.auditCriteria.update({
      where: { id },
      data: buildSoftDeleteDataWithInactive(deletedBy),
    });
  }

  async findByCode(code: string): Promise<AuditCriteriaDto> {
    const criteria = await this.prisma.auditCriteria.findFirst({
      where: { code, ...isNotDeleted },
    });

    this.errorHandler.throwIfNotFoundByField('AuditCriteria', 'code', code, criteria);

    return this.auditCriteriaMapper(criteria);
  }

  /**
   * Reorder criteria by updating order field for each criterion in a single transaction.
   * Prevents duplicate order conflicts that can occur when updating one-by-one.
   */
  async reorder(auditClauseId: string, criterionIds: string[]): Promise<void> {
    if (!criterionIds?.length) return;
    const auditClause = await this.prisma.auditClause.findFirst({
      where: { id: auditClauseId, ...isNotDeleted },
    });
    this.errorHandler.throwIfNotFoundById('AuditClause', auditClauseId, auditClause);

    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < criterionIds.length; i++) {
        await tx.auditCriteria.updateMany({
          where: {
            id: criterionIds[i],
            auditClauseId,
            deletedAt: null,
          },
          data: { order: i },
        });
      }
    });

    await this.regenerateCriteriaCodes(auditClauseId);
  }
}
