import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateHseCategoryDto } from './dto/create-hse-category.dto';
import { UpdateHseCategoryDto } from './dto/update-hse-category.dto';
import { HseCategoryDto } from './dto/hse-category.dto';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
}

@Injectable()
export class HseCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createHseCategoryDto: CreateHseCategoryDto): Promise<HseCategoryDto> {
    const category = await (this.prisma as any).hseCategory.create({
      data: createHseCategoryDto,
    });

    return this.mapToDto(category);
  }

  async findAll(options?: FindAllOptions): Promise<{ data: HseCategoryDto[]; meta: { total: number; page: number; limit: number } }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc',
      isActive,
      search,
    } = options || {};

    const where: any = {};
    
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

    const [categories, total] = await Promise.all([
      (this.prisma as any).hseCategory.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (this.prisma as any).hseCategory.count({ where }),
    ]);

    return {
      data: categories.map(category => this.mapToDto(category)),
      meta: { total, page, limit },
    };
  }

  async findOne(id: string): Promise<HseCategoryDto> {
    const category = await (this.prisma as any).hseCategory.findUnique({
      where: { id },
      include: {
        threats: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`HSE category with ID ${id} not found`);
    }

    return this.mapToDto(category);
  }

  async update(id: string, updateHseCategoryDto: UpdateHseCategoryDto): Promise<HseCategoryDto> {
    const existingCategory = await (this.prisma as any).hseCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundException(`HSE category with ID ${id} not found`);
    }

    const updatedCategory = await (this.prisma as any).hseCategory.update({
      where: { id },
      data: updateHseCategoryDto,
      include: {
        threats: true,
      },
    });

    return this.mapToDto(updatedCategory);
  }

  async remove(id: string): Promise<void> {
    const category = await (this.prisma as any).hseCategory.findUnique({
      where: { id },
      include: {
        threats: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`HSE category with ID ${id} not found`);
    }

    if (category.threats.length > 0) {
      throw new NotFoundException(`Cannot delete HSE category with ID ${id} because it has associated threats`);
    }

    await (this.prisma as any).hseCategory.delete({
      where: { id },
    });
  }

  private mapToDto(category: any): HseCategoryDto {
    return {
      id: category.id,
      name: category.name,
      code: category.code,
      description: category.description,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      threats: category.threats,
    };
  }
} 