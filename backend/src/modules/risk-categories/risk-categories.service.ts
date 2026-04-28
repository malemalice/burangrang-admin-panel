import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { buildSoftDeleteDataWithInactive, isNotDeleted } from '../../shared/utils/soft-delete.util';
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
  name?: string;
  code?: string;
}

@Injectable()
export class RiskCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRiskCategoryDto: CreateRiskCategoryDto): Promise<RiskCategoryDto> {
    const existing = await (this.prisma as any).riskCategory.findFirst({
      where: { code: createRiskCategoryDto.code, ...isNotDeleted },
    });
    if (existing) {
      throw new ConflictException('Code already exists');
    }
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
      name,
      code,
    } = options || {};

    const andConditions: any[] = [];

    // Search: name field only (MDRC-012)
    if (search) {
      andConditions.push({ name: { contains: search, mode: 'insensitive' } });
    }

    // Filter: name (contains)
    if (name) {
      andConditions.push({ name: { contains: name, mode: 'insensitive' } });
    }

    // Filter: code (contains)
    if (code) {
      andConditions.push({ code: { contains: code, mode: 'insensitive' } });
    }

    if (isActive !== undefined) {
      andConditions.push({ isActive });
    }

    andConditions.push({ deletedAt: null });

    const where = andConditions.length > 0 ? { AND: andConditions } : { deletedAt: null };

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
    const category = await (this.prisma as any).riskCategory.findFirst({
      where: { id, ...isNotDeleted },
      include: {
        risks: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Type of hazard with ID ${id} not found`);
    }

    return this.mapToDto(category);
  }

  async update(id: string, updateRiskCategoryDto: UpdateRiskCategoryDto): Promise<RiskCategoryDto> {
    const existingCategory = await (this.prisma as any).riskCategory.findFirst({
      where: { id, ...isNotDeleted },
    });

    if (!existingCategory) {
      throw new NotFoundException(`Type of hazard with ID ${id} not found`);
    }

    if (updateRiskCategoryDto.code !== undefined && updateRiskCategoryDto.code !== existingCategory.code) {
      const duplicate = await (this.prisma as any).riskCategory.findFirst({
        where: { code: updateRiskCategoryDto.code, ...isNotDeleted },
      });
      if (duplicate) {
        throw new ConflictException('Code already exists');
      }
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

  async remove(id: string, deletedBy?: string): Promise<void> {
    const category = await (this.prisma as any).riskCategory.findFirst({
      where: { id, ...isNotDeleted },
      include: {
        risks: { where: { ...isNotDeleted } },
      },
    });

    if (!category) {
      throw new NotFoundException(`Type of hazard with ID ${id} not found`);
    }

    if (category.risks.length > 0) {
      throw new NotFoundException(`Cannot delete type of hazard with ID ${id} because it has associated risks`);
    }

    await (this.prisma as any).riskCategory.update({
      where: { id },
      data: buildSoftDeleteDataWithInactive(deletedBy),
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