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
    const { categoryIds, fileUrl, courseId, ...productData } = createProductDto;

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        fileUrl, // Store the file URL reference
        createdBy,
        categories: categoryIds ? {
          create: categoryIds.map(categoryId => ({
            categoryId,
          })),
        } : undefined,
        // Note: Course relation is handled by updating the Course's productId field
        // We'll handle this in a separate operation after product creation
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

    // Handle course relation if courseId is provided
    if (courseId) {
      await this.prisma.course.update({
        where: { id: courseId },
        data: { productId: product.id },
      });
      
      // Refetch product with updated course relation
      const updatedProduct = await this.prisma.product.findUnique({
        where: { id: product.id },
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

      return this.productMapper(updatedProduct);
    }

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

  async findPublishedOne(id: string): Promise<ProductDto> {
    const product = await this.prisma.product.findUnique({
      where: { 
        id,
        status: 'PUBLISHED',
        isActive: true,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            // Remove email for public access - not needed for course detail page
          },
        },
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                // Only include essential category fields for public access
              },
            },
          },
        },
        // Remove files include - not needed for course detail page
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            shortDescription: true,
            thumbnailUrl: true,
            totalChapters: true,
            totalDuration: true,
            difficulty: true,
            language: true,
            rating: true,
            reviewCount: true,
            studentCount: true,
            instructorId: true,
            status: true,
            isPublished: true,
            isActive: true,
            // Only include essential course fields for public access
          },
        },
      },
    });

    this.errorHandler.throwIfNotFoundById('Published Product', id, product);

    return this.productMapper(product);
  }

  async findPublishedOneBySlug(slug: string): Promise<ProductDto> {
    const product = await this.prisma.product.findUnique({
      where: { 
        slug,
        status: 'PUBLISHED',
        isActive: true,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            // Remove email for public access - not needed for course detail page
          },
        },
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                // Only include essential category fields for public access
              },
            },
          },
        },
        // Remove files include - not needed for course detail page
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            shortDescription: true,
            thumbnailUrl: true,
            totalChapters: true,
            totalDuration: true,
            difficulty: true,
            language: true,
            rating: true,
            reviewCount: true,
            studentCount: true,
            instructorId: true,
            status: true,
            isPublished: true,
            isActive: true,
            // Only include essential course fields for public access
          },
        },
      },
    });

    this.errorHandler.throwIfNotFoundById('Published Product', slug, product);

    return this.productMapper(product);
  }

  async update(id: string, updateProductDto: UpdateProductDto, updatedBy: string): Promise<ProductDto> {
    const { categoryIds, fileUrl, courseId, ...productData } = updateProductDto;

    // Check if product exists
    await this.findOne(id);

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        fileUrl, // Update the file URL reference
        ...(categoryIds && {
          categories: {
            deleteMany: {},
            create: categoryIds.map(categoryId => ({
              categoryId,
            })),
          },
        }),
        // Note: Course relation is handled by updating the Course's productId field
        // We'll handle this in a separate operation after product update
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

    // Handle course relation if courseId is provided
    if (courseId !== undefined) {
      if (courseId) {
        // Connect course to this product
        await this.prisma.course.update({
          where: { id: courseId },
          data: { productId: product.id },
        });
      } else {
        // Disconnect any existing course from this product
        await this.prisma.course.updateMany({
          where: { productId: product.id },
          data: { productId: null },
        });
      }
      
      // Refetch product with updated course relation
      const updatedProduct = await this.prisma.product.findUnique({
        where: { id: product.id },
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

      return this.productMapper(updatedProduct);
    }

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

  /**
   * Get random published products for recommendations
   * @param limit - Number of random products to return (default: 6)
   * @param excludeIds - Product IDs to exclude from recommendations
   * @returns Array of random published products
   */
  async findRandom(limit: number = 6, excludeIds: string[] = []): Promise<ProductDto[]> {
    // Get total count of published products
    const totalCount = await this.prisma.product.count({
      where: {
        status: 'PUBLISHED',
        isActive: true,
        id: { notIn: excludeIds },
      },
    });

    // If we have fewer products than requested, adjust limit
    const actualLimit = Math.min(limit, totalCount);
    
    if (actualLimit === 0) {
      return [];
    }

    // Generate random skip value to get random products
    // For better randomness, we'll get a larger set and pick randomly from them
    const fetchCount = Math.min(totalCount, actualLimit * 3);
    const randomSkip = Math.max(0, Math.floor(Math.random() * (totalCount - fetchCount + 1)));

    // Fetch products with random offset
    const products = await this.prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        isActive: true,
        id: { notIn: excludeIds },
      },
      skip: randomSkip,
      take: fetchCount,
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                imageUrl: true,
              },
            },
          },
        },
        files: {
          select: {
            id: true,
            fileName: true,
            filePath: true,
            fileType: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            totalChapters: true,
            totalDuration: true,
            difficulty: true,
          },
        },
      },
    });

    // Shuffle the fetched products and take the requested limit
    const shuffled = products.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, actualLimit);

    return this.productArrayMapper(selected);
  }
}
