import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AreasService } from './areas.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { AreaDto } from './dto/area.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../shared/decorators/allow-options-bypass.decorator';

@ApiTags('Areas')
@ApiBearerAuth()
@Controller('areas')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Post()
  @Permissions('area:create')
  @ApiOperation({ summary: 'Create a new area' })
  @ApiResponse({ status: 201, description: 'Area created', type: AreaDto })
  create(@Body() createAreaDto: CreateAreaDto): Promise<AreaDto> {
    return this.areasService.create(createAreaDto);
  }

  @Get()
  @AllowOptionsBypass()
  @Permissions('area:list')
  @ApiOperation({ summary: 'Get all areas' })
  @ApiResponse({ status: 200, description: 'List of areas', type: [AreaDto] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'hasRoom', required: false, type: Boolean, description: 'Filter by room assignment status' })
  @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('hasRoom') hasRoom?: string,
  ) {
    return this.areasService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy,
      sortOrder,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      search,
      hasRoom: hasRoom !== undefined ? hasRoom === 'true' : undefined,
    });
  }

  @Get(':id')
  @Permissions('area:read')
  @ApiOperation({ summary: 'Get area by ID' })
  @ApiResponse({ status: 200, description: 'Area details', type: AreaDto })
  @ApiResponse({ status: 404, description: 'Area not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<AreaDto> {
    return this.areasService.findOne(id);
  }

  @Patch(':id')
  @Permissions('area:update')
  @ApiOperation({ summary: 'Update area' })
  @ApiResponse({ status: 200, description: 'Area updated', type: AreaDto })
  @ApiResponse({ status: 404, description: 'Area not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAreaDto: UpdateAreaDto,
  ): Promise<AreaDto> {
    return this.areasService.update(id, updateAreaDto);
  }

  @Delete(':id')
  @Permissions('area:delete')
  @ApiOperation({ summary: 'Delete area' })
  @ApiResponse({ status: 200, description: 'Area deleted' })
  @ApiResponse({ status: 404, description: 'Area not found' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.areasService.remove(id);
  }
}
