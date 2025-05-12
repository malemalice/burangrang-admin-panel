import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentDto } from './dto/department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(createDepartmentDto: CreateDepartmentDto): Promise<DepartmentDto> {
    const department = await this.prisma.department.create({
      data: createDepartmentDto,
    });

    return new DepartmentDto(department);
  }

  async findAll(): Promise<DepartmentDto[]> {
    const departments = await this.prisma.department.findMany();
    return departments.map((department) => new DepartmentDto(department));
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

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto): Promise<DepartmentDto> {
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

  async findByCode(code: string): Promise<DepartmentDto | null> {
    const department = await this.prisma.department.findUnique({
      where: { code },
    });

    return department ? new DepartmentDto(department) : null;
  }
} 