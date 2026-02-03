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
} from '@nestjs/swagger';
import { IncidentsService } from '../services/incidents.service';
import { CreateIncidentDto, UpdateIncidentDto, IncidentDto, FindIncidentsDto } from '../dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import { Permissions } from '../../../shared/decorators/permissions.decorator';

// Define interface for request with user property
interface RequestWithUser extends ExpressRequest {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('Incidents')
@ApiBearerAuth()
@Controller('incidents')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @Permissions('incident:create')
  @ApiOperation({ summary: 'Create a new incident' })
  @ApiResponse({ status: 201, type: IncidentDto })
  async create(
    @Request() req: RequestWithUser,
    @Body() createIncidentDto: CreateIncidentDto,
  ): Promise<IncidentDto> {
    return this.incidentsService.create(createIncidentDto, req.user.id);
  }

  @Get()
  @Permissions('incident:list')
  @ApiOperation({ summary: 'Get all incidents with pagination and filtering' })
  @ApiResponse({ status: 200, type: [IncidentDto] })
  async findAll(@Query() query: FindIncidentsDto) {
    return this.incidentsService.findAll(query);
  }

  @Get(':id')
  @Permissions('incident:read')
  @ApiOperation({ summary: 'Get an incident by id' })
  @ApiResponse({ status: 200, type: IncidentDto })
  async findOne(@Param('id') id: string): Promise<IncidentDto> {
    return this.incidentsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('incident:update')
  @ApiOperation({ summary: 'Update an incident' })
  @ApiResponse({ status: 200, type: IncidentDto })
  async update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateIncidentDto: UpdateIncidentDto,
  ): Promise<IncidentDto> {
    return this.incidentsService.update(id, updateIncidentDto, req.user.id);
  }

  @Delete(':id')
  @Permissions('incident:delete')
  @ApiOperation({ summary: 'Soft delete an incident (set isActive to false)' })
  @ApiResponse({ status: 200, type: IncidentDto })
  async remove(@Param('id') id: string): Promise<IncidentDto> {
    return this.incidentsService.remove(id);
  }

  @Post(':id/submit')
  @Permissions('incident:update')
  @ApiOperation({ summary: 'Submit incident for approval' })
  @ApiResponse({ status: 200, type: IncidentDto })
  async submit(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<IncidentDto> {
    return this.incidentsService.submit(id, req.user.id);
  }

  @Post(':id/approve')
  @Permissions('incident:update')
  @ApiOperation({ summary: 'Approve incident' })
  @ApiResponse({ status: 200, type: IncidentDto })
  async approve(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: { notes?: string },
  ): Promise<IncidentDto> {
    return this.incidentsService.approve(id, body.notes || '', req.user.id);
  }

  @Post(':id/reject')
  @Permissions('incident:update')
  @ApiOperation({ summary: 'Reject incident' })
  @ApiResponse({ status: 200, type: IncidentDto })
  async reject(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ): Promise<IncidentDto> {
    return this.incidentsService.reject(id, body.reason, req.user.id);
  }

  @Get(':id/approval-rights')
  @Permissions('incident:read')
  @ApiOperation({ summary: 'Check if user can approve/reject incident' })
  @ApiResponse({ status: 200 })
  async checkApprovalRights(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    return this.incidentsService.checkApprovalRights(id, req.user.id);
  }

  @Get(':id/timeline')
  @Permissions('incident:read')
  @ApiOperation({ summary: 'Get approval timeline for incident' })
  @ApiResponse({ status: 200 })
  async getTimeline(@Param('id') id: string) {
    return this.incidentsService.getTimeline(id);
  }
}
