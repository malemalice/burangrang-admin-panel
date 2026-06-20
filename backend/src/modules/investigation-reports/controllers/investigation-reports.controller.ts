import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import { Permissions } from '../../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../../shared/decorators/allow-options-bypass.decorator';
import { InvestigationReportsService } from '../services/investigation-reports.service';
import {
  CreateInvestigationReportDto,
  FindInvestigationReportsDto,
  InvestigationReportDto,
  UpdateInvestigationReportDto,
} from '../dto';
interface RequestWithUser extends ExpressRequest {
  user: { id: string; email: string; role: string };
}

@ApiTags('Investigation Reports')
@ApiBearerAuth()
@Controller('investigation-reports')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class InvestigationReportsController {
  constructor(private readonly service: InvestigationReportsService) {}

  // Note: the HFACS catalogue is now served from /hfacs-nodes/tree
  // (HfacsNodesController). Clients previously calling /investigation-reports/catalogue/hfacs
  // must migrate to GET /hfacs-nodes/tree.

  @Post()
  @Permissions('investigation-report:create')
  @ApiOperation({ summary: 'Create a new investigation report' })
  @ApiResponse({ status: 201, type: InvestigationReportDto })
  async create(
    @Request() req: RequestWithUser,
    @Body() dto: CreateInvestigationReportDto,
  ) {
    return this.service.create(dto, req.user.id);
  }

  @Get()
  @AllowOptionsBypass()
  @Permissions('investigation-report:list')
  @ApiOperation({ summary: 'List investigation reports' })
  @ApiQuery({ name: 'options', required: false, type: Boolean })
  async findAll(
    @Request() req: RequestWithUser,
    @Query() query: FindInvestigationReportsDto,
  ) {
    return this.service.findAll(query, req.user.id);
  }

  @Get('by-incident/:incidentId')
  @Permissions('investigation-report:read')
  @ApiOperation({ summary: 'Get the investigation report for a given incident (or null)' })
  async findByIncidentId(
    @Request() req: RequestWithUser,
    @Param('incidentId') incidentId: string,
  ) {
    return this.service.findByIncidentId(incidentId, req.user.id);
  }

  @Get(':id')
  @Permissions('investigation-report:read')
  @ApiOperation({ summary: 'Get an investigation report by id' })
  @ApiResponse({ status: 200, type: InvestigationReportDto })
  async findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.service.findOne(id, req.user.id);
  }

  @Patch(':id')
  @Permissions('investigation-report:update')
  @ApiOperation({ summary: 'Update an investigation report' })
  async update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateInvestigationReportDto,
  ) {
    return this.service.update(id, dto, req.user.id);
  }

  @Post(':id/complete')
  @Permissions('investigation-report:update')
  @ApiOperation({ summary: 'Mark an investigation report as COMPLETE' })
  async complete(@Param('id') id: string) {
    return this.service.markComplete(id);
  }

  @Post(':id/reopen')
  @Permissions('investigation-report:update')
  @ApiOperation({ summary: 'Reopen a completed investigation report (back to DRAFT)' })
  async reopen(@Param('id') id: string) {
    return this.service.reopen(id);
  }

  @Delete(':id')
  @Permissions('investigation-report:delete')
  @ApiOperation({ summary: 'Soft delete an investigation report' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
