import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { StorageLocationsService } from '../services/storage-locations.service';
import { CreateStorageLocationDto, UpdateStorageLocationDto, StorageLocationDto } from '../dto/storage-locations';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { Role } from '../../../shared/types/role.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('storage-locations')
@ApiBearerAuth()
@Controller('storage-locations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StorageLocationsController {
  constructor(private readonly service: StorageLocationsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Create a new storage location' })
  @ApiBody({ type: CreateStorageLocationDto })
  @ApiResponse({ status: 201, description: 'The storage location has been successfully created.', type: StorageLocationDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  create(@Body() dto: CreateStorageLocationDto, @Request() req: any): Promise<StorageLocationDto> {
    return this.service.create(dto, req.user.id);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Get all storage locations' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'areaId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return all storage locations.', type: [StorageLocationDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('areaId') areaId?: string,
  ) {
    return this.service.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      isActive: isActive === undefined ? undefined : isActive === 'true',
      areaId,
    });
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Get storage location by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Return the storage location.', type: StorageLocationDto })
  @ApiResponse({ status: 404, description: 'Storage location not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string): Promise<StorageLocationDto> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Update storage location' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateStorageLocationDto })
  @ApiResponse({ status: 200, description: 'The storage location has been successfully updated.', type: StorageLocationDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Storage location not found' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  update(@Param('id') id: string, @Body() dto: UpdateStorageLocationDto): Promise<StorageLocationDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Delete storage location' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'The storage location has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Storage location not found' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
