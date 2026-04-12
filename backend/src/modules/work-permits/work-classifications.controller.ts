import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AllowOptionsBypass } from '../../shared/decorators/allow-options-bypass.decorator';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { CreateWorkClassificationDto } from './dto/create-work-classification.dto';
import { UpdateWorkClassificationDto } from './dto/update-work-classification.dto';
import { WorkClassificationDto } from './dto/work-classification.dto';
import { WorkClassificationsService } from './work-classifications.service';

@ApiTags('work-classifications')
@ApiBearerAuth()
@Controller('work-classifications')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class WorkClassificationsController {
  constructor(private readonly workClassificationsService: WorkClassificationsService) {}

  @Post()
  @Permissions('work-permit:create')
  @ApiOperation({ summary: 'Create a work classification' })
  @ApiResponse({ status: 201, description: 'Work classification created', type: WorkClassificationDto })
  create(@Body() createDto: CreateWorkClassificationDto): Promise<WorkClassificationDto> {
    return this.workClassificationsService.create(createDto);
  }

  @Get()
  @AllowOptionsBypass()
  @Permissions('work-permit:list')
  @ApiOperation({ summary: 'List work classifications' })
  @ApiResponse({ status: 200, description: 'Paginated list', type: [WorkClassificationDto] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'options',
    required: false,
    type: Boolean,
    description: 'Set to true to bypass permission check (requires JWT auth only)',
  })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    return this.workClassificationsService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy,
      sortOrder,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      search,
    });
  }

  @Get(':id')
  @Permissions('work-permit:read')
  @ApiOperation({ summary: 'Get work classification by ID' })
  @ApiResponse({ status: 200, description: 'Work classification', type: WorkClassificationDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<WorkClassificationDto> {
    return this.workClassificationsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('work-permit:update')
  @ApiOperation({ summary: 'Update work classification' })
  @ApiResponse({ status: 200, description: 'Updated', type: WorkClassificationDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateWorkClassificationDto,
  ): Promise<WorkClassificationDto> {
    return this.workClassificationsService.update(id, updateDto);
  }

  @Delete(':id')
  @Permissions('work-permit:delete')
  @ApiOperation({ summary: 'Delete work classification' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'In use by work permits' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.workClassificationsService.remove(id);
  }
}
