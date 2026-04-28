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
import { EnvironmentalMeasurementsService } from './environmental-measurements.service';
import { CreateEnvironmentalMeasurementDto } from './dto/create-environmental-measurement.dto';
import { UpdateEnvironmentalMeasurementDto } from './dto/update-environmental-measurement.dto';
import { EnvironmentalMeasurementDto } from './dto/environmental-measurement.dto';
import { RegulatoryLimitsResponseDto } from './dto/regulatory-limits.dto';
import { SubmitApprovalDecisionDto } from './dto/submit-approval-decision.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../shared/decorators/allow-options-bypass.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('environmental-measurements')
@ApiBearerAuth()
@Controller('environmental-measurements')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class EnvironmentalMeasurementsController {
  constructor(private readonly measurementsService: EnvironmentalMeasurementsService) {}

  @Get('regulatory-limits')
  @AllowOptionsBypass()
  @Permissions('environmental-measurement:list')
  @ApiOperation({ summary: 'Get regulatory limits for environmental measurements' })
  @ApiResponse({
    status: 200,
    description: 'Return regulatory limits (numeric limit + min/max mode per metric).',
    type: RegulatoryLimitsResponseDto,
  })
  getRegulatoryLimits(): Promise<RegulatoryLimitsResponseDto> {
    return this.measurementsService.getRegulatoryLimits();
  }

  @Post()
  @Permissions('environmental-measurement:create')
  @ApiOperation({ summary: 'Create a new environmental measurement' })
  @ApiResponse({ status: 201, description: 'The measurement has been successfully created.', type: EnvironmentalMeasurementDto })
  create(
    @Body() createDto: CreateEnvironmentalMeasurementDto,
    @Request() req: any,
  ): Promise<EnvironmentalMeasurementDto> {
    return this.measurementsService.create(createDto, req.user.id);
  }

  @Get()
  @AllowOptionsBypass()
  @Permissions('environmental-measurement:list')
  @ApiOperation({ summary: 'Get all environmental measurements with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'roomId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })
  @ApiResponse({ status: 200, description: 'Return all environmental measurements.', type: [EnvironmentalMeasurementDto] })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('roomId') roomId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ): Promise<{ data: EnvironmentalMeasurementDto[]; meta: { total: number } }> {
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const isActiveBoolean = isActive === undefined ? undefined : isActive === 'true';

    return this.measurementsService.findAll({
      page: pageNumber,
      limit: limitNumber,
      sortBy,
      sortOrder,
      isActive: isActiveBoolean,
      search,
      roomId,
      startDate,
      endDate,
      status,
    });
  }

  @Get(':id')
  @Permissions('environmental-measurement:read')
  @ApiOperation({ summary: 'Get an environmental measurement by id' })
  @ApiResponse({ status: 200, description: 'Return the environmental measurement.', type: EnvironmentalMeasurementDto })
  @ApiResponse({ status: 404, description: 'Environmental measurement not found.' })
  findOne(@Param('id') id: string): Promise<EnvironmentalMeasurementDto> {
    return this.measurementsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('environmental-measurement:update')
  @ApiOperation({ summary: 'Update an environmental measurement' })
  @ApiResponse({ status: 200, description: 'The measurement has been successfully updated.', type: EnvironmentalMeasurementDto })
  @ApiResponse({ status: 404, description: 'Environmental measurement not found.' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateEnvironmentalMeasurementDto,
  ): Promise<EnvironmentalMeasurementDto> {
    return this.measurementsService.update(id, updateDto);
  }

  @Delete(':id')
  @Permissions('environmental-measurement:delete')
  @ApiOperation({ summary: 'Delete an environmental measurement' })
  @ApiResponse({ status: 200, description: 'The measurement has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Environmental measurement not found.' })
  remove(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ): Promise<void> {
    return this.measurementsService.remove(id, req.user.id);
  }

  @Patch(':id/submit')
  @Permissions('environmental-measurement:update')
  @ApiOperation({ summary: 'Submit a measurement (DRAFT → OPEN, or REJECTED → OPEN to resubmit after rejection)' })
  @ApiResponse({ status: 200, description: 'Measurement submitted.', type: EnvironmentalMeasurementDto })
  submit(@Param('id') id: string): Promise<EnvironmentalMeasurementDto> {
    return this.measurementsService.submit(id);
  }

  @Patch(':id/request-approval')
  @Permissions('environmental-measurement:update')
  @ApiOperation({ summary: 'Request approval for a measurement (OPEN → WAITING_APPROVAL)' })
  @ApiResponse({ status: 200, description: 'Approval requested.', type: EnvironmentalMeasurementDto })
  requestApproval(@Param('id') id: string): Promise<EnvironmentalMeasurementDto> {
    return this.measurementsService.requestApproval(id);
  }

  @Get(':id/approval-status')
  @Permissions('environmental-measurement:read')
  @ApiOperation({ summary: 'Get approval status and history for a measurement' })
  @ApiResponse({ status: 200, description: 'Return approval status and history.' })
  getApprovalStatus(@Param('id') id: string) {
    return this.measurementsService.getApprovalStatus(id);
  }

  @Get(':id/check-approval')
  @Permissions('environmental-measurement:read')
  @ApiOperation({ summary: 'Check if the current user can approve this measurement' })
  @ApiResponse({ status: 200, description: 'Return canApprove flag.' })
  checkApprovalRights(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.measurementsService.checkApprovalRights(id, req.user.id);
  }

  @Post(':id/approval')
  @Permissions('environmental-measurement:update')
  @ApiOperation({ summary: 'Submit an approval decision (approve/reject)' })
  @ApiResponse({ status: 201, description: 'Approval decision submitted.' })
  submitApprovalDecision(
    @Param('id') id: string,
    @Body() dto: SubmitApprovalDecisionDto,
    @Request() req: any,
  ) {
    return this.measurementsService.submitApprovalDecision(id, dto, req.user.id);
  }
}
