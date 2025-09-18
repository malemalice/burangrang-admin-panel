import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateProductTypeDto } from './dto/create-product-type.dto';
import { UpdateProductTypeDto } from './dto/update-product-type.dto';
import { ProductTypeDto } from './dto/product-type.dto';
import { FindProductTypesOptions } from './dto/find-product-types.dto';
import { Prisma } from '@prisma/client';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';

@Injectable()
export class ProductTypesService {
  private productTypeMapper: (productType: any) => ProductTypeDto;
  private productTypeArrayMapper: (productTypes: any[]) => ProductTypeDto[];
  private productTypePaginatedMapper: (data: { data: any[]; meta: any }) => { data: ProductTypeDto[]; meta: any };

  constructor(
    private prisma: PrismaService,
    private errorHandler: ErrorHandlingService,
    private dtoMapper: DtoMapperService,
  ) {
    // Initialize mappers
    this.productTypeMapper = this.dtoMapper.createSimpleMapper(ProductTypeDto);
    this.productTypeArrayMapper = this.dtoMapper.createArrayMapper(ProductTypeDto);
    this.productTypePaginatedMapper = this.dtoMapper.createPaginatedMapper(ProductTypeDto);
  }

  async create(createProductTypeDto: CreateProductTypeDto): Promise<ProductTypeDto> {
    const productType = await this.prisma.productType.create({
      data: {
        ...createProductTypeDto,
        isActive: createProductTypeDto.isActive ?? true,
      },
    });

    return this.productTypeMapper(productType);
  }

  async findAll(options?: FindProductTypesOptions): Promise<{
    data: ProductTypeDto[];
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

    const where: Prisma.ProductTypeWhereInput = {};

    if (search) {
      // Search in name and description fields
      const searchTerm = search.trim();
      if (searchTerm.length > 0) {
        where.OR = [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [productTypes, total] = await Promise.all([
      this.prisma.productType.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.productType.count({ where }),
    ]);

    return this.productTypePaginatedMapper({
      data: productTypes,
      meta: { total, page, limit },
    });
  }

  async findOne(id: string): Promise<ProductTypeDto> {
    const productType = await this.prisma.productType.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('ProductType', id, productType);

    return this.productTypeMapper(productType);
  }

  async update(id: string, updateProductTypeDto: UpdateProductTypeDto): Promise<ProductTypeDto> {
    const existingProductType = await this.prisma.productType.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('ProductType', id, existingProductType);

    const updatedProductType = await this.prisma.productType.update({
      where: { id },
      data: updateProductTypeDto,
    });

    return this.productTypeMapper(updatedProductType);
  }

  async remove(id: string): Promise<void> {
    const existingProductType = await this.prisma.productType.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('ProductType', id, existingProductType);

    await this.prisma.productType.delete({
      where: { id },
    });
  }

  async findByName(name: string): Promise<ProductTypeDto | null> {
    const productType = await this.prisma.productType.findUnique({
      where: { name },
    });

    return productType ? this.productTypeMapper(productType) : null;
  }

  async findByNameOrThrow(name: string): Promise<ProductTypeDto> {
    const productType = await this.prisma.productType.findUnique({
      where: { name },
    });

    this.errorHandler.throwIfNotFoundByField('ProductType', 'name', name, productType);

    return this.productTypeMapper(productType);
  }
}
