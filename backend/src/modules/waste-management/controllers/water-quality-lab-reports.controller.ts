import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { WaterQualityLabReportsService } from '../services/water-quality-lab-reports.service';
import { CreateWaterQualityLabReportDto, UpdateWaterQualityLabReportDto, WaterQualityLabReportDto } from '../dto/water-quality-lab-reports';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { Role } from '../../../shared/types/role.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('water-quality-lab-reports')
@ApiBearerAuth()
@Controller('water-quality-lab-reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WaterQualityLabReportsController {
  constructor(private readonly service: WaterQualityLabReportsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create a new water quality lab report' })
  @ApiBody({ type: CreateWaterQualityLabReportDto })
  @ApiResponse({ status: 201, description: 'The report has been successfully created.', type: WaterQualityLabReportDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  create(@Body() dto: CreateWaterQualityLabReportDto, @Request() req: any): Promise<WaterQualityLabReportDto> {
    return this.service.create(dto, req.user.id);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Get all water quality lab reports' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'treatmentPlantId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return all reports.', type: [WaterQualityLabReportDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('treatmentPlantId') treatmentPlantId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      treatmentPlantId,
      status,
    });
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Get water quality lab report by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Return the report.', type: WaterQualityLabReportDto })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string): Promise<WaterQualityLabReportDto> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Update water quality lab report' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateWaterQualityLabReportDto })
  @ApiResponse({ status: 200, description: 'The report has been successfully updated.', type: WaterQualityLabReportDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  update(@Param('id') id: string, @Body() dto: UpdateWaterQualityLabReportDto): Promise<WaterQualityLabReportDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Delete water quality lab report' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'The report has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
