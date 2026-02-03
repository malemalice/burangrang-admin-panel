import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { WasteTypesService } from '../services/waste-types.service';
import { CreateWasteTypeDto, UpdateWasteTypeDto, WasteTypeDto } from '../dto/waste-types';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import { Permissions } from '../../../shared/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('waste-types')
@ApiBearerAuth()
@Controller('waste-types')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class WasteTypesController {
  constructor(private readonly service: WasteTypesService) {}

  @Post()
  @Permissions('waste-management:create')
  @ApiOperation({ summary: 'Create a new waste type' })
  @ApiBody({ type: CreateWasteTypeDto })
  @ApiResponse({ status: 201, description: 'The waste type has been successfully created.', type: WasteTypeDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  create(@Body() dto: CreateWasteTypeDto): Promise<WasteTypeDto> {
    return this.service.create(dto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Get all waste types' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'wasteType', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return all waste types.', type: [WasteTypeDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('wasteType') wasteType?: string,
  ) {
    return this.service.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      isActive: isActive === undefined ? undefined : isActive === 'true',
      wasteType,
    });
  }

  @Get(':id')
  @Permissions('waste-management:read')
  @ApiOperation({ summary: 'Get waste type by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Return the waste type.', type: WasteTypeDto })
  @ApiResponse({ status: 404, description: 'Waste type not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string): Promise<WasteTypeDto> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Permissions('waste-management:update')
  @ApiOperation({ summary: 'Update waste type' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateWasteTypeDto })
  @ApiResponse({ status: 200, description: 'The waste type has been successfully updated.', type: WasteTypeDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Waste type not found' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  update(@Param('id') id: string, @Body() dto: UpdateWasteTypeDto): Promise<WasteTypeDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions('waste-management:delete')
  @ApiOperation({ summary: 'Delete waste type' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'The waste type has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Waste type not found' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
