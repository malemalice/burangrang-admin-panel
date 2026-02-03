import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { WasteSourcesService } from '../services/waste-sources.service';
import { CreateWasteSourceDto, UpdateWasteSourceDto, WasteSourceDto } from '../dto/waste-sources';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import { Permissions } from '../../../shared/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('waste-sources')
@ApiBearerAuth()
@Controller('waste-sources')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WasteSourcesController {
  constructor(private readonly service: WasteSourcesService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Create a new waste source' })
  @ApiBody({ type: CreateWasteSourceDto })
  @ApiResponse({ status: 201, description: 'The waste source has been successfully created.', type: WasteSourceDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  create(@Body() dto: CreateWasteSourceDto): Promise<WasteSourceDto> {
    return this.service.create(dto);
  }

  @Get()
  @Permissions('waste-management:list')
  @ApiOperation({ summary: 'Get all waste sources' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'sourceType', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return all waste sources.', type: [WasteSourceDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('sourceType') sourceType?: string,
  ) {
    return this.service.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      isActive: isActive === undefined ? undefined : isActive === 'true',
      sourceType,
    });
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Get waste source by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Return the waste source.', type: WasteSourceDto })
  @ApiResponse({ status: 404, description: 'Waste source not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string): Promise<WasteSourceDto> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Permissions('waste-management:update')
  @ApiOperation({ summary: 'Update waste source' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateWasteSourceDto })
  @ApiResponse({ status: 200, description: 'The waste source has been successfully updated.', type: WasteSourceDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Waste source not found' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  update(@Param('id') id: string, @Body() dto: UpdateWasteSourceDto): Promise<WasteSourceDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions('waste-management:delete')
  @ApiOperation({ summary: 'Delete waste source' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'The waste source has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Waste source not found' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
