import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProductTypesService } from './product-types.service';
import { CreateProductTypeDto } from './dto/create-product-type.dto';
import { UpdateProductTypeDto } from './dto/update-product-type.dto';
import { ProductTypeDto } from './dto/product-type.dto';
import { FindProductTypesOptions } from './dto/find-product-types.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/types/role.enum';

@ApiTags('product-types')
@ApiBearerAuth()
@Controller('product-types')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductTypesController {
  constructor(private readonly productTypesService: ProductTypesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product type' })
  @ApiBody({ type: CreateProductTypeDto })
  @ApiResponse({
    status: 201,
    description: 'The product type has been successfully created.',
    type: ProductTypeDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - product type with this name already exists.',
  })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  create(@Body() createProductTypeDto: CreateProductTypeDto): Promise<ProductTypeDto> {
    return this.productTypesService.create(createProductTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all product types with pagination and filtering' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (starts from 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Field to sort by',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term for name or description',
  })
  @ApiResponse({
    status: 200,
    description: 'Return paginated list of product types.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ProductTypeDto' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number', description: 'Total number of product types' },
            page: { type: 'number', description: 'Current page number' },
            limit: { type: 'number', description: 'Items per page' },
          },
        },
      },
    },
  })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ): Promise<{ data: ProductTypeDto[]; meta: { total: number; page: number; limit: number } }> {
    // Convert string parameters to their proper types
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const isActiveBoolean =
      isActive === undefined ? undefined : isActive === 'true';

    return this.productTypesService.findAll({
      page: pageNumber,
      limit: limitNumber,
      sortBy,
      sortOrder,
      isActive: isActiveBoolean,
      search,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product type by ID' })
  @ApiParam({ name: 'id', description: 'Product Type ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Return the product type.',
    type: ProductTypeDto,
  })
  @ApiResponse({ status: 404, description: 'Product type not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions.',
  })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  findOne(@Param('id') id: string): Promise<ProductTypeDto> {
    return this.productTypesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product type' })
  @ApiParam({ name: 'id', description: 'Product Type ID', type: String })
  @ApiBody({ type: UpdateProductTypeDto })
  @ApiResponse({
    status: 200,
    description: 'The product type has been successfully updated.',
    type: ProductTypeDto,
  })
  @ApiResponse({ status: 404, description: 'Product type not found.' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions.',
  })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateProductTypeDto: UpdateProductTypeDto,
  ): Promise<ProductTypeDto> {
    return this.productTypesService.update(id, updateProductTypeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product type' })
  @ApiParam({ name: 'id', description: 'Product Type ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'The product type has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Product type not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions.',
  })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  remove(@Param('id') id: string): Promise<void> {
    return this.productTypesService.remove(id);
  }
}
