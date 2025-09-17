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
import { OfficesService } from './offices.service';
import { CreateOfficeDto } from './dto/create-office.dto';
import { UpdateOfficeDto } from './dto/update-office.dto';
import { OfficeDto } from './dto/office.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/types/role.enum';

@ApiTags('offices')
@ApiBearerAuth()
@Controller('offices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OfficesController {
  constructor(private readonly officesService: OfficesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new office' })
  @ApiBody({ type: CreateOfficeDto })
  @ApiResponse({
    status: 201,
    description: 'The office has been successfully created.',
    type: OfficeDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error.' })
  @ApiResponse({ status: 409, description: 'Conflict - office with this code already exists.' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  create(@Body() createOfficeDto: CreateOfficeDto): Promise<OfficeDto> {
    return this.officesService.create(createOfficeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all offices with pagination and filtering' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Field to sort by' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiResponse({
    status: 200,
    description: 'Return paginated list of offices.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/OfficeDto' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number', description: 'Total number of offices' },
          },
        },
      },
    },
  })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
  ): Promise<{ data: OfficeDto[]; meta: { total: number } }> {
    // Convert string parameters to their proper types
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const isActiveBoolean =
      isActive === undefined ? undefined : isActive === 'true';

    return this.officesService.findAll({
      page: pageNumber,
      limit: limitNumber,
      sortBy,
      sortOrder,
      isActive: isActiveBoolean,
    });
  }

  @Get('hierarchy')
  @ApiOperation({ summary: 'Get office hierarchy' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiResponse({
    status: 200,
    description: 'Return office hierarchy.',
    type: [OfficeDto],
  })
  getHierarchy(): Promise<OfficeDto[]> {
    return this.officesService.getOfficeHierarchy();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an office by ID' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiParam({ name: 'id', description: 'Office ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Return the office.',
    type: OfficeDto,
  })
  @ApiResponse({ status: 404, description: 'Office not found.' })
  findOne(@Param('id') id: string): Promise<OfficeDto> {
    return this.officesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an office' })
  @ApiParam({ name: 'id', description: 'Office ID', type: String })
  @ApiBody({ type: UpdateOfficeDto })
  @ApiResponse({
    status: 200,
    description: 'The office has been successfully updated.',
    type: OfficeDto,
  })
  @ApiResponse({ status: 404, description: 'Office not found.' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error.' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateOfficeDto: UpdateOfficeDto,
  ): Promise<OfficeDto> {
    return this.officesService.update(id, updateOfficeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an office' })
  @ApiParam({ name: 'id', description: 'Office ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'The office has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Office not found.' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  remove(@Param('id') id: string): Promise<void> {
    return this.officesService.remove(id);
  }
}
