import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryDto } from './dto/category.dto';
import { FindCategoriesOptions } from './dto/find-categories.dto';
import { Prisma } from '@prisma/client';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';

@Injectable()
export class CategoriesService {
  private categoryMapper: (category: any) => CategoryDto;
  private categoryArrayMapper: (categories: any[]) => CategoryDto[];
  private categoryPaginatedMapper: (data: { data: any[]; meta: any }) => { data: CategoryDto[]; meta: any };

  constructor(
    private prisma: PrismaService,
    private errorHandler: ErrorHandlingService,
    private dtoMapper: DtoMapperService,
  ) {
    // Initialize mappers
    this.categoryMapper = this.dtoMapper.createMapper(CategoryDto);
    this.categoryArrayMapper = this.dtoMapper.createArrayMapper(CategoryDto);
    this.categoryPaginatedMapper = this.dtoMapper.createPaginatedMapper(CategoryDto);
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<CategoryDto> {
    const category = await this.prisma.category.create({
      data: createCategoryDto,
      include: {
        parent: true,
        children: true,
      },
    });

    return this.categoryMapper(category);
  }

  async findAll(options?: FindCategoriesOptions): Promise<{
    data: CategoryDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
      search,
      parentId,
    } = options || {};

    const where: Prisma.CategoryWhereInput = {};

    if (search) {
      const searchTerm = search.trim();
      if (searchTerm.length > 0) {
        where.OR = [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { slug: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (parentId !== undefined) {
      if (parentId === null || parentId === '') {
        where.parentId = null;
      } else {
        where.parentId = parentId;
      }
    }

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        include: {
          parent: true,
          children: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.category.count({ where }),
    ]);

    return this.categoryPaginatedMapper({
      data: categories,
      meta: { total, page, limit },
    });
  }

  async findOne(id: string): Promise<CategoryDto> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
      },
    });

    this.errorHandler.throwIfNotFoundById('Category', id, category);

    return this.categoryMapper(category);
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryDto> {
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('Category', id, existingCategory);

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        parent: true,
        children: true,
      },
    });

    return this.categoryMapper(updatedCategory);
  }

  async remove(id: string): Promise<void> {
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('Category', id, existingCategory);

    // Check if category has children
    const childrenCount = await this.prisma.category.count({
      where: { parentId: id },
    });

    if (childrenCount > 0) {
      throw new Error('Cannot delete category with children. Please remove or reassign children first.');
    }

    await this.prisma.category.delete({
      where: { id },
    });
  }

  async findHierarchy(): Promise<CategoryDto[]> {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    return this.categoryArrayMapper(categories);
  }

  async findBySlug(slug: string): Promise<CategoryDto | null> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: true,
      },
    });

    return category ? this.categoryMapper(category) : null;
  }
}
