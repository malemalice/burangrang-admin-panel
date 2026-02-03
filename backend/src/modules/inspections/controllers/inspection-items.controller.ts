import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Query,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { GeneralStatusEnum } from '@prisma/client';
import { InspectionsService } from '../services/inspections.service';
import {
  UpdateInspectionItemDto,
  InspectionItemDto,
} from '../dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import { Permissions } from '../../../shared/decorators/permissions.decorator';

@ApiTags('Inspection Items')
@ApiBearerAuth()
@Controller('inspection-items')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class InspectionItemsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Get()
  @Permissions('inspection:list')
  @ApiOperation({ summary: 'Get all inspection items with pagination and filtering' })
  @ApiResponse({ status: 200, type: [InspectionItemDto] })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  @ApiQuery({ name: 'status', required: false, enum: GeneralStatusEnum, description: 'Filter by status' })
  @ApiQuery({ name: 'assignedDepartmentId', required: false, type: String, description: 'Filter by assigned department ID' })
  @ApiQuery({ name: 'assigneeId', required: false, type: String, description: 'Filter by assignee user ID' })
  @ApiQuery({ name: 'riskId', required: false, type: String, description: 'Filter by risk ID' })
  @ApiQuery({ name: 'riskCategoryId', required: false, type: String, description: 'Filter by risk category ID' })
  @ApiQuery({ name: 'inspectionCode', required: false, type: String, description: 'Search by inspection code' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('status') status?: GeneralStatusEnum,
    @Query('assignedDepartmentId') assignedDepartmentId?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('riskId') riskId?: string,
    @Query('riskCategoryId') riskCategoryId?: string,
    @Query('inspectionCode') inspectionCode?: string,
    @Query('search') search?: string,
  ) {
    return this.inspectionsService.findAllItemsStandalone({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      sortBy,
      sortOrder,
      status,
      assignedDepartmentId,
      assigneeId,
      riskId,
      riskCategoryId,
      inspectionCode,
      search,
    });
  }

  @Get(':id')
  @Permissions('inspection:read')
  @ApiOperation({ summary: 'Get an inspection item by id' })
  @ApiResponse({ status: 200, type: InspectionItemDto })
  async findOne(@Param('id') id: string): Promise<InspectionItemDto> {
    return this.inspectionsService.findOneItemStandalone(id);
  }

  @Patch(':id')
  @Permissions('inspection:update')
  @ApiOperation({ summary: 'Update an inspection item' })
  @ApiResponse({ status: 200, type: InspectionItemDto })
  async update(
    @Param('id') id: string,
    @Body() updateItemDto: UpdateInspectionItemDto,
  ): Promise<InspectionItemDto> {
    return this.inspectionsService.updateItemStandalone(id, updateItemDto);
  }
}
