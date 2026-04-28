import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../shared/decorators/allow-options-bypass.decorator';
import { DepartmentDto } from './dto/department.dto';

@ApiTags('departments')
@ApiBearerAuth()
@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Permissions('department:create')
  @ApiOperation({ summary: 'Create a new department' })
  @ApiResponse({
    status: 201,
    description: 'The department has been successfully created.',
    type: DepartmentDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  
  create(
    @Body() createDepartmentDto: CreateDepartmentDto,
  ): Promise<DepartmentDto> {
    return this.departmentsService.create(createDepartmentDto);
  }

  @Get()
  @AllowOptionsBypass()
  @Permissions('department:list')
  @ApiOperation({ summary: 'Get all departments' })
  @ApiResponse({
    status: 200,
    description: 'Return all departments.',
    type: [DepartmentDto],
  })
  @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('name') name?: string,
    @Query('code') code?: string,
  ): Promise<{ data: DepartmentDto[]; meta: { total: number } }> {
    // Convert string parameters to their proper types
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const isActiveBoolean =
      isActive === undefined ? undefined : isActive === 'true';

    return this.departmentsService.findAll({
      page: pageNumber,
      limit: limitNumber,
      sortBy,
      sortOrder,
      isActive: isActiveBoolean,
      search,
      name,
      code,
    });
  }

  @Get(':id')
  @Permissions('department:read')
  @ApiOperation({ summary: 'Get a department by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the department.',
    type: DepartmentDto,
  })
  @ApiResponse({ status: 404, description: 'Department not found.' })
  
  findOne(@Param('id') id: string): Promise<DepartmentDto> {
    return this.departmentsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('department:update')
  @ApiOperation({ summary: 'Update a department' })
  @ApiResponse({
    status: 200,
    description: 'The department has been successfully updated.',
    type: DepartmentDto,
  })
  @ApiResponse({ status: 404, description: 'Department not found.' })
  update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<DepartmentDto> {
    return this.departmentsService.update(id, updateDepartmentDto);
  }

  @Delete(':id')
  @Permissions('department:delete')
  @ApiOperation({ summary: 'Delete a department' })
  @ApiResponse({
    status: 200,
    description: 'The department has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Department not found.' })
  remove(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string } },
  ): Promise<void> {
    return this.departmentsService.remove(id, req.user.id);
  }

  @Get('code/:code')
  @Permissions('department:read')
  @ApiOperation({ summary: 'Get a department by code' })
  @ApiResponse({
    status: 200,
    description: 'Return the department.',
    type: DepartmentDto,
  })
  @ApiResponse({ status: 404, description: 'Department not found.' })
  
  findByCode(@Param('code') code: string): Promise<DepartmentDto> {
    return this.departmentsService.findByCode(code);
  }
}
