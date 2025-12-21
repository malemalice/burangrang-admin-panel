import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateRiskCategoryDto } from './dto/create-risk-category.dto';
import { UpdateRiskCategoryDto } from './dto/update-risk-category.dto';
import { RiskCategoryDto } from './dto/risk-category.dto';

interface FindAllOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  search?: string;
}

@Injectable()
export class RiskCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRiskCategoryDto: CreateRiskCategoryDto): Promise<RiskCategoryDto> {
    const category = await (this.prisma as any).riskCategory.create({
      data: createRiskCategoryDto,
    });

    return this.mapToDto(category);
  }

  async findAll(options?: FindAllOptions): Promise<{ data: RiskCategoryDto[]; meta: { total: number; page: number; limit: number } }> {
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
      (this.prisma as any).riskCategory.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (this.prisma as any).riskCategory.count({ where }),
    ]);

    return {
      data: categories.map(category => this.mapToDto(category)),
      meta: { total, page, limit },
    };
  }

  async findOne(id: string): Promise<RiskCategoryDto> {
    const category = await (this.prisma as any).riskCategory.findUnique({
      where: { id },
      include: {
        risks: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Risk category with ID ${id} not found`);
    }

    return this.mapToDto(category);
  }

  async update(id: string, updateRiskCategoryDto: UpdateRiskCategoryDto): Promise<RiskCategoryDto> {
    const existingCategory = await (this.prisma as any).riskCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundException(`Risk category with ID ${id} not found`);
    }

    const updatedCategory = await (this.prisma as any).riskCategory.update({
      where: { id },
      data: updateRiskCategoryDto,
      include: {
        risks: true,
      },
    });

    return this.mapToDto(updatedCategory);
  }

  async remove(id: string): Promise<void> {
    const category = await (this.prisma as any).riskCategory.findUnique({
      where: { id },
      include: {
        risks: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Risk category with ID ${id} not found`);
    }

    if (category.risks.length > 0) {
      throw new NotFoundException(`Cannot delete risk category with ID ${id} because it has associated risks`);
    }

    await (this.prisma as any).riskCategory.delete({
      where: { id },
    });
  }

  private mapToDto(category: any): RiskCategoryDto {
    return {
      id: category.id,
      name: category.name,
      code: category.code,
      description: category.description,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      risks: category.risks,
    };
  }
} 