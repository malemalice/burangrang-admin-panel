import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateAuditElementDto } from '../dto/create-audit-element.dto';
import { UpdateAuditElementDto } from '../dto/update-audit-element.dto';
import { AuditElementDto } from '../dto/audit-element.dto';
import { Prisma } from '@prisma/client';
import { PRISMA_ERROR_CODES } from '../../../shared/constants/prisma-errors';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';
import { DtoMapperService } from '../../../shared/services/dto-mapper.service';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
  code?: string;
}

@Injectable()
export class AuditElementsService {
  private auditElementMapper: (element: any) => AuditElementDto;
  private auditElementArrayMapper: (elements: any[]) => AuditElementDto[];
  private auditElementPaginatedMapper: (data: { data: any[]; meta: any }) => {
    data: AuditElementDto[];
    meta: any;
  };

  constructor(
    private prisma: PrismaService,
    private errorHandler: ErrorHandlingService,
    private dtoMapper: DtoMapperService,
  ) {
    this.auditElementMapper = this.dtoMapper.createSimpleMapper(AuditElementDto);
    this.auditElementArrayMapper = this.dtoMapper.createSimpleArrayMapper(AuditElementDto);
    this.auditElementPaginatedMapper = this.dtoMapper.createPaginatedMapper(AuditElementDto);
  }

  async create(
    createAuditElementDto: CreateAuditElementDto,
  ): Promise<AuditElementDto> {
    const existingByCode = await this.prisma.auditElement.findUnique({
      where: { code: createAuditElementDto.code },
    });
    if (existingByCode) {
      this.errorHandler.throwConflictCustom('Code already exist');
    }

    const data: Prisma.AuditElementCreateInput = {
      name: createAuditElementDto.name,
      code: createAuditElementDto.code,
      description: createAuditElementDto.description,
      isActive: createAuditElementDto.isActive ?? true,
    };

    let element;
    try {
      element = await this.prisma.auditElement.create({
        data,
      });
    } catch (error: any) {
      if (error?.code === PRISMA_ERROR_CODES.UNIQUE_VIOLATION) {
        this.errorHandler.throwConflictCustom('Code already exist');
      }
      throw error;
    }

    return this.auditElementMapper(element);
  }

  async findAll(options?: FindAllOptions): Promise<{
    data: AuditElementDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
      search,
      code,
    } = options || {};

    const where: Prisma.AuditElementWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (code) {
      where.code = { contains: code, mode: 'insensitive' };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const validSortFields = ['name', 'code', 'createdAt', 'isActive'];
    const sortField = sortBy && validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const order = sortOrder || 'desc';
    const orderBy: Prisma.AuditElementOrderByWithRelationInput[] = [
      { [sortField]: order },
      { id: order },
    ];

    const total = await this.prisma.auditElement.count({ where });

    const elements = await this.prisma.auditElement.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    return this.auditElementPaginatedMapper({
      data: elements,
      meta: { total, page, limit },
    });
  }

  async findOne(id: string): Promise<AuditElementDto> {
    const element = await this.prisma.auditElement.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('AuditElement', id, element);

    return this.auditElementMapper(element);
  }

  async update(
    id: string,
    updateAuditElementDto: UpdateAuditElementDto,
  ): Promise<AuditElementDto> {
    const existingElement = await this.prisma.auditElement.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('AuditElement', id, existingElement);

    const updateData: Prisma.AuditElementUpdateInput = {};

    if (updateAuditElementDto.name !== undefined) {
      updateData.name = updateAuditElementDto.name;
    }
    if (updateAuditElementDto.code !== undefined) {
      updateData.code = updateAuditElementDto.code;
    }
    if (updateAuditElementDto.description !== undefined) {
      updateData.description = updateAuditElementDto.description;
    }
    if (updateAuditElementDto.isActive !== undefined) {
      updateData.isActive = updateAuditElementDto.isActive;
    }

    const element = await this.prisma.auditElement.update({
      where: { id },
      data: updateData,
    });

    return this.auditElementMapper(element);
  }

  async remove(id: string): Promise<void> {
    const existingElement = await this.prisma.auditElement.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('AuditElement', id, existingElement);

    await this.prisma.auditElement.delete({
      where: { id },
    });
  }

  async findByCode(code: string): Promise<AuditElementDto> {
    const element = await this.prisma.auditElement.findUnique({
      where: { code },
    });

    this.errorHandler.throwIfNotFoundByField('AuditElement', 'code', code, element);

    return this.auditElementMapper(element);
  }
}
