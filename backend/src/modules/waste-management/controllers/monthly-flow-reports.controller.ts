import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { MonthlyFlowReportsService } from '../services/monthly-flow-reports.service';
import {
  CreateMonthlyFlowReportDto,
  UpdateMonthlyFlowReportDto,
  MonthlyFlowReportDto,
} from '../dto/monthly-flow-reports';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import { Permissions } from '../../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../../shared/decorators/allow-options-bypass.decorator';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { Role } from '../../../shared/types/role.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('monthly-flow-reports')
@ApiBearerAuth()
@Controller('monthly-flow-reports')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class MonthlyFlowReportsController {
  constructor(private readonly service: MonthlyFlowReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new monthly flow report' })
  @ApiBody({ type: CreateMonthlyFlowReportDto })
  @ApiResponse({
    status: 201,
    description: 'The report has been successfully created.',
    type: MonthlyFlowReportDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  create(
    @Body() dto: CreateMonthlyFlowReportDto,
    @Request() req: any,
  ): Promise<MonthlyFlowReportDto> {
    return this.service.create(dto, req.user.id);
  }

  @Get()
  @AllowOptionsBypass()
  @Permissions('waste-management:list')
  @ApiOperation({ summary: 'Get all monthly flow reports' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'treatmentPlantId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'reportMonth', required: false, type: String })
  @ApiQuery({ name: 'reportYear', required: false, type: Number })
  @ApiQuery({
    name: 'options',
    required: false,
    type: Boolean,
    description:
      'Set to true to bypass permission check (requires JWT auth only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Return all reports.',
    type: [MonthlyFlowReportDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('treatmentPlantId') treatmentPlantId?: string,
    @Query('status') status?: string,
    @Query('reportMonth') reportMonth?: string,
    @Query('reportYear') reportYear?: string,
  ) {
    return this.service.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      isActive: isActive === undefined ? undefined : isActive === 'true',
      treatmentPlantId,
      status,
      reportMonth,
      reportYear: reportYear ? parseInt(reportYear, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get monthly flow report by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Return the report.',
    type: MonthlyFlowReportDto,
  })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string): Promise<MonthlyFlowReportDto> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Permissions('waste-management:update')
  @ApiOperation({ summary: 'Update monthly flow report' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateMonthlyFlowReportDto })
  @ApiResponse({
    status: 200,
    description: 'The report has been successfully updated.',
    type: MonthlyFlowReportDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMonthlyFlowReportDto,
  ): Promise<MonthlyFlowReportDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions('waste-management:delete')
  @ApiOperation({ summary: 'Delete monthly flow report' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'The report has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Report not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
