import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentDto } from './dto/department.dto';
import { Prisma } from '@prisma/client';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
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
}

@Injectable()
export class DepartmentsService {
  private departmentMapper: (department: any) => DepartmentDto;
  private departmentArrayMapper: (departments: any[]) => DepartmentDto[];
  private departmentPaginatedMapper: (data: { data: any[]; meta: any }) => { data: DepartmentDto[]; meta: any };

  constructor(
    private prisma: PrismaService,
    private errorHandler: ErrorHandlingService,
    private dtoMapper: DtoMapperService,
  ) {
    // Initialize mappers
    this.departmentMapper = this.dtoMapper.createSimpleMapper(DepartmentDto);
    this.departmentArrayMapper = this.dtoMapper.createSimpleArrayMapper(DepartmentDto);
    this.departmentPaginatedMapper = this.dtoMapper.createPaginatedMapper(DepartmentDto);
  }

  async create(
    createDepartmentDto: CreateDepartmentDto,
  ): Promise<DepartmentDto> {
    // Prepare data for Prisma, handling JSON field properly
    const data: Prisma.DepartmentCreateInput = {
      name: createDepartmentDto.name,
      code: createDepartmentDto.code,
      description: createDepartmentDto.description,
      isActive: createDepartmentDto.isActive ?? true,
    };

    // Handle emails JSON field - Prisma accepts arrays directly for JSON
    if (createDepartmentDto.emails !== undefined) {
      data.emails = createDepartmentDto.emails as any;
    }

    let department: any;
    try {
      department = await this.prisma.department.create({
        data,
      });
    } catch (error: any) {
      // Prisma unique constraint violation (e.g. duplicate code)
      if (error?.code === 'P2002' && error?.meta?.target?.includes('code')) {
        this.errorHandler.throwBadRequest('Department code already exist');
      }
      throw error;
    }

    return this.departmentMapper(department);
  }

  async findAll(options?: FindAllOptions): Promise<{
    data: DepartmentDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy,
      sortOrder,
      isActive,
      search,
      name,
      code,
    } = options || {};

    // Build where clause
    const where: Prisma.DepartmentWhereInput = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    }

    if (code) {
      where.code = { contains: code, mode: 'insensitive' };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Build order by clause
    const orderBy: Prisma.DepartmentOrderByWithRelationInput = sortBy
      ? ({ [sortBy]: sortOrder || 'asc' } as Prisma.DepartmentOrderByWithRelationInput)
      : { createdAt: 'desc' };

    // Get total count
    const total = await this.prisma.department.count({ where });

    // Get paginated data
    const departments = await this.prisma.department.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    return this.departmentPaginatedMapper({
      data: departments,
      meta: { total, page, limit },
    });
  }

  async findOne(id: string): Promise<DepartmentDto> {
    const department = await this.prisma.department.findFirst({
      where: { id, deletedAt: null },
    });

    this.errorHandler.throwIfNotFoundById('Department', id, department);

    return this.departmentMapper(department);
  }

  async update(
    id: string,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<DepartmentDto> {
    const existingDepartment = await this.prisma.department.findFirst({
      where: { id, deletedAt: null },
    });

    this.errorHandler.throwIfNotFoundById('Department', id, existingDepartment);

    // Prepare data for Prisma, handling JSON field properly
    const updateData: Prisma.DepartmentUpdateInput = {};

    if (updateDepartmentDto.name !== undefined) {
      updateData.name = updateDepartmentDto.name;
    }
    if (updateDepartmentDto.code !== undefined) {
      updateData.code = updateDepartmentDto.code;
    }
    if (updateDepartmentDto.description !== undefined) {
      updateData.description = updateDepartmentDto.description;
    }
    if (updateDepartmentDto.isActive !== undefined) {
      updateData.isActive = updateDepartmentDto.isActive;
    }

    // Handle emails JSON field - Prisma accepts arrays directly for JSON
    if ('emails' in updateDepartmentDto) {
      updateData.emails = updateDepartmentDto.emails as any;
    }

    let department: any;
    try {
      department = await this.prisma.department.update({
        where: { id },
        data: updateData,
      });
    } catch (error: any) {
      // Prisma unique constraint violation (e.g. duplicate code)
      if (error?.code === 'P2002' && error?.meta?.target?.includes('code')) {
        this.errorHandler.throwBadRequest('Department code already exist');
      }
      throw error;
    }

    return this.departmentMapper(department);
  }

  async remove(id: string, deletedBy: string): Promise<void> {
    const existingDepartment = await this.prisma.department.findFirst({
      where: { id, deletedAt: null },
    });

    this.errorHandler.throwIfNotFoundById('Department', id, existingDepartment);

    await this.prisma.department.update({
      where: { id },
      data: buildSoftDeleteDataWithInactive(deletedBy),
    });
  }

  async findByCode(code: string): Promise<DepartmentDto> {
    const department = await this.prisma.department.findFirst({
      where: { code, deletedAt: null },
    });

    this.errorHandler.throwIfNotFoundByField('Department', 'code', code, department);

    return this.departmentMapper(department);
  }
}
