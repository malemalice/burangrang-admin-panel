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
import { Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { IncidentActivitiesEnum, IncidentScopeEnum } from '@prisma/client';
import { IncidentsService } from '../services/incidents.service';
import { CreateIncidentDto, UpdateIncidentDto, IncidentDto, FindIncidentsDto } from '../dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import { Permissions } from '../../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../../shared/decorators/allow-options-bypass.decorator';

interface RequestWithUser extends ExpressRequest {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('Incident Securities')
@ApiBearerAuth()
@Controller('incident-securities')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class IncidentSecuritiesController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @Permissions('incident-security:create')
  @ApiOperation({ summary: 'Create a new security incident' })
  @ApiResponse({ status: 201, type: IncidentDto })
  async create(
    @Request() req: RequestWithUser,
    @Body() createIncidentDto: CreateIncidentDto,
  ): Promise<IncidentDto> {
    return this.incidentsService.create(
      { ...createIncidentDto, type: IncidentScopeEnum.SECURITY },
      req.user.id,
    );
  }

  @Get()
  @AllowOptionsBypass()
  @Permissions('incident-security:list')
  @ApiOperation({ summary: 'Get all security incidents with pagination and filtering' })
  @ApiResponse({ status: 200, type: [IncidentDto] })
  @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })
  async findAll(@Query() query: FindIncidentsDto) {
    return this.incidentsService.findAll({ ...query, type: IncidentScopeEnum.SECURITY });
  }

  @Get(':id')
  @Permissions('incident-security:read')
  @ApiOperation({ summary: 'Get a security incident by id' })
  @ApiResponse({ status: 200, type: IncidentDto })
  async findOne(@Param('id') id: string): Promise<IncidentDto> {
    return this.incidentsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('incident-security:update')
  @ApiOperation({ summary: 'Update a security incident' })
  @ApiResponse({ status: 200, type: IncidentDto })
  async update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateIncidentDto: UpdateIncidentDto,
  ): Promise<IncidentDto> {
    return this.incidentsService.update(id, updateIncidentDto, req.user.id);
  }

  @Delete(':id')
  @Permissions('incident-security:delete')
  @ApiOperation({ summary: 'Soft delete a security incident (set isActive to false)' })
  @ApiResponse({ status: 200, type: IncidentDto })
  async remove(@Param('id') id: string): Promise<IncidentDto> {
    return this.incidentsService.remove(id);
  }

  @Post(':id/submit')
  @Permissions('incident-security:update')
  @ApiOperation({ summary: 'Submit security incident for approval' })
  @ApiResponse({ status: 200, type: IncidentDto })
  async submit(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<IncidentDto> {
    return this.incidentsService.submit(id, req.user.id);
  }

  @Post(':id/approve')
  @Permissions('incident-security:read')
  @ApiOperation({ summary: 'Approve security incident' })
  @ApiResponse({ status: 200, type: IncidentDto })
  async approve(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: { notes?: string; activities?: IncidentActivitiesEnum },
  ): Promise<IncidentDto> {
    return this.incidentsService.approve(id, body.notes ?? '', req.user.id, body.activities);
  }

  @Post(':id/reject')
  @Permissions('incident-security:read')
  @ApiOperation({ summary: 'Reject security incident' })
  @ApiResponse({ status: 200, type: IncidentDto })
  async reject(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ): Promise<IncidentDto> {
    return this.incidentsService.reject(id, body.reason, req.user.id);
  }

  @Get(':id/approval-rights')
  @Permissions('incident-security:read')
  @ApiOperation({ summary: 'Check if user can approve/reject security incident' })
  @ApiResponse({ status: 200 })
  async checkApprovalRights(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    return this.incidentsService.checkApprovalRights(id, req.user.id);
  }

  @Get(':id/timeline')
  @Permissions('incident-security:read')
  @ApiOperation({ summary: 'Get approval timeline for security incident' })
  @ApiResponse({ status: 200 })
  async getTimeline(@Param('id') id: string) {
    return this.incidentsService.getTimeline(id);
  }
}
