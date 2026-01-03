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

  /**
   * Generate clause code based on element code and clause order
   */
  private generateClauseCode(elementCode: string, order: number): string {
    return `${elementCode}.${order + 1}`;
  }

  /**
   * Regenerate codes for all clauses in an audit element
   */
  async regenerateClauseCodes(auditElementId: string): Promise<void> {
    // Get the audit element to get its code
    const auditElement = await this.prisma.auditElement.findUnique({
      where: { id: auditElementId },
    });

    this.errorHandler.throwIfNotFoundById('AuditElement', auditElementId, auditElement);

    // Get all clauses ordered by order field
    const clauses = await this.prisma.auditClause.findMany({
      where: { auditElementId },
      orderBy: { order: 'asc' },
      include: {
        criteria: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // Update clause codes and criteria codes
    for (let i = 0; i < clauses.length; i++) {
      const clause = clauses[i];
      const newClauseCode = this.generateClauseCode(auditElement!.code, i);

      // Update clause code
      await this.prisma.auditClause.update({
        where: { id: clause.id },
        data: { code: newClauseCode },
      });

      // Update all criteria codes in this clause
      for (let j = 0; j < clause.criteria.length; j++) {
        const criterion = clause.criteria[j];
        const newCriteriaCode = `${newClauseCode}.${j + 1}`;
        await this.prisma.auditCriteria.update({
          where: { id: criterion.id },
          data: { code: newCriteriaCode },
        });
      }
    }
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

    // Auto-generate code if not provided
    const code = createAuditClauseDto.code || this.generateClauseCode(
      auditElement.code,
      createAuditClauseDto.order,
    );

    const data: Prisma.AuditClauseCreateInput = {
      name: createAuditClauseDto.name,
      code,
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

    // Regenerate all clause codes to ensure consistency
    await this.regenerateClauseCodes(auditElement.id);

    // Return the updated clause
    const updatedClause = await this.prisma.auditClause.findUnique({
      where: { id: clause.id },
    });

    return this.auditClauseMapper(updatedClause);
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
      include: {
        auditElement: true,
      },
    });

    this.errorHandler.throwIfNotFoundById('AuditClause', id, existingClause);

    // If auditElementId is being updated, verify it exists
    let auditElementId = existingClause.auditElementId;
    if (updateAuditClauseDto.auditElementId !== undefined) {
      const auditElement = await this.prisma.auditElement.findUnique({
        where: { id: updateAuditClauseDto.auditElementId },
      });

      this.errorHandler.throwIfNotFoundById(
        'AuditElement',
        updateAuditClauseDto.auditElementId,
        auditElement,
      );
      auditElementId = updateAuditClauseDto.auditElementId;
    }

    const updateData: Prisma.AuditClauseUpdateInput = {};

    if (updateAuditClauseDto.name !== undefined) {
      updateData.name = updateAuditClauseDto.name;
    }
    // Don't allow manual code updates - it will be auto-generated
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

    // Regenerate all clause codes if order or element changed
    if (updateAuditClauseDto.order !== undefined || updateAuditClauseDto.auditElementId !== undefined) {
      await this.regenerateClauseCodes(auditElementId);
      // Return updated clause
      const updatedClause = await this.prisma.auditClause.findUnique({
        where: { id },
      });
      return this.auditClauseMapper(updatedClause);
    }

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
