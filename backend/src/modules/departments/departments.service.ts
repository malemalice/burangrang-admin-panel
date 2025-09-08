import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentDto } from './dto/department.dto';
import { Prisma } from '@prisma/client';

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
  constructor(private prisma: PrismaService) {}

  async create(
    createDepartmentDto: CreateDepartmentDto,
  ): Promise<DepartmentDto> {
    const department = await this.prisma.department.create({
      data: createDepartmentDto,
    });

    return new DepartmentDto(department);
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

    return {
      data: departments.map((department) => new DepartmentDto(department)),
      meta: { total, page, limit },
    };
  }

  async findOne(id: string): Promise<DepartmentDto> {
    const department = await this.prisma.department.findUnique({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return new DepartmentDto(department);
  }

  async update(
    id: string,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<DepartmentDto> {
    const existingDepartment = await this.prisma.department.findUnique({
      where: { id },
    });

    if (!existingDepartment) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    const department = await this.prisma.department.update({
      where: { id },
      data: updateDepartmentDto,
    });

    return new DepartmentDto(department);
  }

  async remove(id: string): Promise<void> {
    const existingDepartment = await this.prisma.department.findUnique({
      where: { id },
    });

    if (!existingDepartment) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    await this.prisma.department.delete({
      where: { id },
    });
  }

  async findByCode(code: string): Promise<DepartmentDto> {
    const department = await this.prisma.department.findUnique({
      where: { code },
    });

    if (!department) {
      throw new NotFoundException(`Department with code ${code} not found`);
    }

    return new DepartmentDto(department);
  }
}
