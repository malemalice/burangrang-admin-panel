import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductDto } from './dto/product.dto';
import { FindProductsDto } from './dto/find-products.dto';
import { Prisma } from '@prisma/client';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { ActivityLoggerService } from '../../shared/services/activity-logger.service';

@Injectable()
export class ProductsService {
  private productMapper: (product: any) => ProductDto;
  private productArrayMapper: (products: any[]) => ProductDto[];
  private productPaginatedMapper: (data: { data: any[]; meta: any }) => { data: ProductDto[]; meta: any };

  constructor(
    private prisma: PrismaService,
    private errorHandler: ErrorHandlingService,
    private dtoMapper: DtoMapperService,
    private activityLogger: ActivityLoggerService,
  ) {
    // Initialize mappers
    this.productMapper = this.dtoMapper.createSimpleMapper(ProductDto);
    this.productArrayMapper = this.dtoMapper.createSimpleArrayMapper(ProductDto);
    this.productPaginatedMapper = this.dtoMapper.createPaginatedMapper(ProductDto);
  }

  async create(createProductDto: CreateProductDto, createdBy: string): Promise<ProductDto> {
    const { categoryIds, ...productData } = createProductDto;

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        createdBy,
        categories: categoryIds ? {
          create: categoryIds.map(categoryId => ({
            categoryId,
          })),
        } : undefined,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
        files: true,
        course: true,
      },
    });

    // Log product creation activity
    await this.activityLogger.logActivity(
      'products',
      product.id,
      `Created product: ${product.name} (SKU: ${product.sku})`,
      [], // Will be populated by logActivity method
      createdBy,
      'product_activity',
    );

    return this.productMapper(product);
  }

  async findAll(options?: FindProductsDto): Promise<{
    data: ProductDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      productType,
      status,
      categoryId,
      createdBy,
      isActive,
      minPrice,
      maxPrice,
      onSale,
    } = options || {};

    const where: Prisma.ProductWhereInput = {};

    if (search) {
      const searchTerm = search.trim();
      if (searchTerm.length > 0) {
        where.OR = [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { shortDescription: { contains: searchTerm, mode: 'insensitive' } },
          { sku: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }
    }

    if (productType) {
      where.productType = productType;
    }

    if (status) {
      where.status = status;
    }

    if (categoryId) {
      where.categories = {
        some: {
          categoryId,
        },
      };
    }

    if (createdBy) {
      where.createdBy = createdBy;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    if (onSale !== undefined) {
      if (onSale) {
        where.salePrice = {
          not: null,
        };
      } else {
        where.salePrice = null;
      }
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          categories: {
            include: {
              category: true,
            },
          },
          files: true,
          course: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return this.productPaginatedMapper({
      data: products,
      meta: { total, page, limit },
    });
  }

  async findOne(id: string): Promise<ProductDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
        files: true,
        course: true,
      },
    });

    this.errorHandler.throwIfNotFoundById('Product', id, product);

    return this.productMapper(product);
  }

  async update(id: string, updateProductDto: UpdateProductDto, updatedBy: string): Promise<ProductDto> {
    const { categoryIds, ...productData } = updateProductDto;

    // Check if product exists
    await this.findOne(id);

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        ...(categoryIds && {
          categories: {
            deleteMany: {},
            create: categoryIds.map(categoryId => ({
              categoryId,
            })),
          },
        }),
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
        files: true,
        course: true,
      },
    });

    // Log product update activity
    await this.activityLogger.logActivity(
      'products',
      product.id,
      `Updated product: ${product.name} (SKU: ${product.sku})`,
      [], // Will be populated by logActivity method
      updatedBy,
      'product_activity',
    );

    return this.productMapper(product);
  }

  async remove(id: string, deletedBy: string): Promise<void> {
    const product = await this.findOne(id);

    await this.prisma.product.delete({
      where: { id },
    });

    // Log product deletion activity
    await this.activityLogger.logActivity(
      'products',
      product.id,
      `Deleted product: ${product.name} (SKU: ${product.sku})`,
      [], // Will be populated by logActivity method
      deletedBy,
      'product_activity',
    );
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.prisma.product.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  }

  async getProductStats(): Promise<{
    total: number;
    active: number;
    byType: Array<{ type: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
    totalViews: number;
    averageRating: number;
  }> {
    const [
      total,
      active,
      byType,
      byStatus,
      totalViews,
      averageRating,
    ] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.product.groupBy({
        by: ['productType'],
        _count: { productType: true },
      }),
      this.prisma.product.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.product.aggregate({
        _sum: { viewCount: true },
      }),
      this.prisma.product.aggregate({
        _avg: { rating: true },
      }),
    ]);

    return {
      total,
      active,
      byType: byType.map(item => ({
        type: item.productType,
        count: item._count.productType,
      })),
      byStatus: byStatus.map(item => ({
        status: item.status,
        count: item._count.status,
      })),
      totalViews: totalViews._sum.viewCount || 0,
      averageRating: Number(averageRating._avg.rating || 0),
    };
  }
}
