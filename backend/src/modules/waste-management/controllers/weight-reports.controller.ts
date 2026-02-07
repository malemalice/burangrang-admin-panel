import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { WeightReportsService } from '../services/weight-reports.service';
import { CreateWeightReportDto, UpdateWeightReportDto, WeightReportDto } from '../dto/weight-reports';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import { Permissions } from '../../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../../shared/decorators/allow-options-bypass.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('weight-reports')
@ApiBearerAuth()
@Controller('weight-reports')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class WeightReportsController {
  constructor(private readonly service: WeightReportsService) { }

  @Post()
  @Permissions('waste-management:create')
  @ApiOperation({ summary: 'Create a new weight report' })
  @ApiBody({ type: CreateWeightReportDto })
  @ApiResponse({ status: 201, description: 'The report has been successfully created.', type: WeightReportDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  create(@Body() dto: CreateWeightReportDto, @Request() req: any): Promise<WeightReportDto> {
    return this.service.create(dto, req.user.id);
  }

  @Get()
  @AllowOptionsBypass()
  @Permissions('waste-management:list')
  @ApiOperation({ summary: 'Get all weight reports' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sourceId', required: false, type: String })
  @ApiQuery({ name: 'storageLocationId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'reportMonth', required: false, type: String })
  @ApiQuery({ name: 'reportYear', required: false, type: Number })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })
  @ApiResponse({ status: 200, description: 'Return all reports.', type: [WeightReportDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sourceId') sourceId?: string,
    @Query('storageLocationId') storageLocationId?: string,
    @Query('status') status?: string,
    @Query('reportMonth') reportMonth?: string,
    @Query('reportYear') reportYear?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.service.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      sourceId,
      storageLocationId,
      status,
      reportMonth,
      reportYear: reportYear ? parseInt(reportYear, 10) : undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
  }

  @Get(':id')
  @Permissions('waste-management:read')
  @ApiOperation({ summary: 'Get weight report by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Return the report.', type: WeightReportDto })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string): Promise<WeightReportDto> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Permissions('waste-management:update')
  @ApiOperation({ summary: 'Update weight report' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateWeightReportDto })
  @ApiResponse({ status: 200, description: 'The report has been successfully updated.', type: WeightReportDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  update(@Param('id') id: string, @Body() dto: UpdateWeightReportDto): Promise<WeightReportDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions('waste-management:delete')
  @ApiOperation({ summary: 'Delete weight report' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'The report has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
