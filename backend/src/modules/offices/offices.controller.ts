import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { Request } from 'express';
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
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../shared/decorators/allow-options-bypass.decorator';

@ApiTags('offices')
@ApiBearerAuth()
@Controller('offices')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class OfficesController {
  constructor(private readonly officesService: OfficesService) {}

  @Post()
  @Permissions('office:create')
  @ApiOperation({ summary: 'Create a new office' })
  @ApiBody({ type: CreateOfficeDto })
  @ApiResponse({
    status: 201,
    description: 'The office has been successfully created.',
    type: OfficeDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error.' })
  @ApiResponse({ status: 409, description: 'Conflict - office with this code already exists.' })
  
  create(@Body() createOfficeDto: CreateOfficeDto): Promise<OfficeDto> {
    return this.officesService.create(createOfficeDto);
  }

  @Get()
  @AllowOptionsBypass()
  @Permissions('office:list')
  @ApiOperation({ summary: 'Get all offices with pagination and filtering' })
  
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Field to sort by' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })
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
    @Query('search') search?: string,
    @Query('name') name?: string,
    @Query('code') code?: string,
    @Query('address') address?: string,
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
      search,
      name,
      code,
      address,
    });
  }

  @Get('hierarchy')
  @Permissions('office:list')
  @ApiOperation({ summary: 'Get office hierarchy' })
  
  @ApiResponse({
    status: 200,
    description: 'Return office hierarchy.',
    type: [OfficeDto],
  })
  getHierarchy(): Promise<OfficeDto[]> {
    return this.officesService.getOfficeHierarchy();
  }

  @Get(':id')
  @Permissions('office:read')
  @ApiOperation({ summary: 'Get an office by ID' })
  
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
  @Permissions('office:update')
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
  
  update(
    @Param('id') id: string,
    @Body() updateOfficeDto: UpdateOfficeDto,
  ): Promise<OfficeDto> {
    return this.officesService.update(id, updateOfficeDto);
  }

  @Delete(':id')
  @Permissions('office:delete')
  @ApiOperation({ summary: 'Delete an office' })
  @ApiParam({ name: 'id', description: 'Office ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'The office has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Office not found.' })
  
  remove(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string } },
  ): Promise<void> {
    return this.officesService.remove(id, req.user.id);
  }
}
