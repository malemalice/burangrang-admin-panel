import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentDto } from './dto/department.dto';
import { Prisma } from '@prisma/client';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
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
    const department = await this.prisma.department.create({
      data: createDepartmentDto,
    });

    return this.departmentMapper(department);
  }

  async findAll(options?: FindAllOptions): Promise<{
    data: DepartmentDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc',
      isActive,
      search,
    } = options || {};

    // Build where clause
    const where: Prisma.DepartmentWhereInput = {};

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

    // Build order by clause
    const orderBy: Prisma.DepartmentOrderByWithRelationInput = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'asc';
    } else {
      orderBy.name = 'asc';
    }

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
    const department = await this.prisma.department.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('Department', id, department);

    return this.departmentMapper(department);
  }

  async update(
    id: string,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<DepartmentDto> {
    const existingDepartment = await this.prisma.department.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('Department', id, existingDepartment);

    const department = await this.prisma.department.update({
      where: { id },
      data: updateDepartmentDto,
    });

    return this.departmentMapper(department);
  }

  async remove(id: string): Promise<void> {
    const existingDepartment = await this.prisma.department.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('Department', id, existingDepartment);

    await this.prisma.department.delete({
      where: { id },
    });
  }

  async findByCode(code: string): Promise<DepartmentDto> {
    const department = await this.prisma.department.findUnique({
      where: { code },
    });

    this.errorHandler.throwIfNotFoundByField('Department', 'code', code, department);

    return this.departmentMapper(department);
  }
}
