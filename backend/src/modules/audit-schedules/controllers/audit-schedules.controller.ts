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
import { GeneralStatusEnum, CompliantStatusEnum } from '@prisma/client';
import { AuditSchedulesService } from '../services/audit-schedules.service';
import {
  CreateAuditScheduleDto,
  UpdateAuditScheduleDto,
  AuditScheduleDto,
  CreateAuditItemDto,
  AuditItemDto,
  AuditResultDto,
  ApproveAuditItemDto,
  RejectAuditItemDto,
} from '../dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import { Permissions } from '../../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../../shared/decorators/allow-options-bypass.decorator';

// Define interface for request with user property
interface RequestWithUser extends ExpressRequest {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('Audit Schedules')
@ApiBearerAuth()
@Controller(['audit-schedules', 'audits'])
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class AuditSchedulesController {
  constructor(
    private readonly auditSchedulesService: AuditSchedulesService,
  ) {}

  @Post()
  @Permissions('audit-schedule:create')
  @ApiOperation({ summary: 'Create a new audit schedule' })
  @ApiResponse({ status: 201, type: AuditScheduleDto })
  async create(
    @Request() req: RequestWithUser,
    @Body() createAuditScheduleDto: CreateAuditScheduleDto,
  ): Promise<AuditScheduleDto> {
    return this.auditSchedulesService.create(
      createAuditScheduleDto,
      req.user.id,
    );
  }

  @Get()
  @AllowOptionsBypass()
  @Permissions('audit-schedule:list')
  @ApiOperation({ summary: 'Get all audit schedules with pagination' })
  @ApiResponse({ status: 200, type: [AuditScheduleDto] })
  @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
    @Query('areaId') areaId?: string | string[],
    @Query('auditElementId') auditElementId?: string | string[],
    @Query('auditorIds') auditorIds?: string | string[],
    @Query('status') status?: GeneralStatusEnum,
    @Query('createdAtFrom') createdAtFrom?: string,
    @Query('createdAtTo') createdAtTo?: string,
  ) {
    // Normalize array parameters
    const areaIds = Array.isArray(areaId) ? areaId : areaId ? [areaId] : undefined;
    const auditElementIds = Array.isArray(auditElementId) ? auditElementId : auditElementId ? [auditElementId] : undefined;
    const normalizedAuditorIds = Array.isArray(auditorIds) ? auditorIds : auditorIds ? [auditorIds] : undefined;

    return this.auditSchedulesService.findAll({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      sortBy,
      sortOrder,
      search: search?.trim() || undefined,
      isActive,
      areaIds,
      auditElementIds,
      auditorIds: normalizedAuditorIds,
      status,
      createdAtFrom: createdAtFrom ? new Date(createdAtFrom) : undefined,
      createdAtTo: createdAtTo ? new Date(createdAtTo) : undefined,
    });
  }

  // Audit Results endpoints - Get all audit items across all audits
  // Must be before :id route to avoid route conflicts
  @Get('results')
  @Permissions('audit-result:list')
  @ApiOperation({ summary: 'Get all audit results (items) with pagination and filtering' })
  @ApiResponse({ status: 200, type: [AuditResultDto] })
  async findAllAuditResults(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('auditId') auditId?: string,
    @Query('auditElementId') auditElementId?: string,
    @Query('auditClauseId') auditClauseId?: string,
    @Query('auditCriteriaId') auditCriteriaId?: string,
    @Query('compliantStatus') compliantStatus?: CompliantStatusEnum,
    @Query('status') status?: GeneralStatusEnum,
    @Query('search') search?: string,
  ) {
    return this.auditSchedulesService.findAllAuditResults({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
      auditId,
      auditElementId,
      auditClauseId,
      auditCriteriaId,
      compliantStatus,
      status,
      search: search?.trim() || undefined,
    });
  }

  @Get(':id')
  @Permissions('audit-schedule:read')
  @ApiOperation({ summary: 'Get an audit schedule by id' })
  @ApiResponse({ status: 200, type: AuditScheduleDto })
  async findOne(@Param('id') id: string): Promise<AuditScheduleDto> {
    return this.auditSchedulesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('audit-schedule:update')
  @ApiOperation({ summary: 'Update an audit schedule' })
  @ApiResponse({ status: 200, type: AuditScheduleDto })
  async update(
    @Param('id') id: string,
    @Body() updateAuditScheduleDto: UpdateAuditScheduleDto,
  ): Promise<AuditScheduleDto> {
    return this.auditSchedulesService.update(id, updateAuditScheduleDto);
  }

  @Delete(':id')
  @Permissions('audit-schedule:delete')
  @ApiOperation({ summary: 'Delete an audit schedule' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id') id: string): Promise<void> {
    return this.auditSchedulesService.remove(id);
  }

  // Audit Items endpoints
  @Post(':id/items')
  @Permissions('audit-result:create')
  @ApiOperation({ summary: 'Create a new audit item' })
  @ApiResponse({ status: 201, type: AuditItemDto })
  async createItem(
    @Param('id') id: string,
    @Body() createAuditItemDto: CreateAuditItemDto,
  ): Promise<AuditItemDto> {
    return this.auditSchedulesService.createAuditItem(id, createAuditItemDto);
  }

  @Get(':id/items')
  @Permissions('audit-schedule:read')
  @ApiOperation({ summary: 'Get all audit items for an audit' })
  @ApiResponse({ status: 200, type: [AuditItemDto] })
  async getItems(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditSchedulesService.getAuditItems(
      id,
      page ? +page : undefined,
      limit ? +limit : undefined,
    );
  }

  @Patch(':id/items/:itemId')
  @Permissions('audit-result:update')
  @ApiOperation({ summary: 'Update an audit item' })
  @ApiResponse({ status: 200, type: AuditItemDto })
  async updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() updateAuditItemDto: Partial<CreateAuditItemDto>,
  ): Promise<AuditItemDto> {
    return this.auditSchedulesService.updateAuditItem(
      id,
      itemId,
      updateAuditItemDto,
    );
  }

  // Approval workflow endpoints
  @Post(':id/items/:itemId/submit-for-approval')
  @Permissions('audit-result:update')
  @ApiOperation({ summary: 'Submit audit item for approval' })
  @ApiResponse({ status: 200, type: AuditItemDto })
  async submitForApproval(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ): Promise<AuditItemDto> {
    return this.auditSchedulesService.submitForApproval(itemId, req.user.id);
  }

  @Post(':id/items/:itemId/approve')
  @ApiOperation({ summary: 'Approve audit item' })
  @ApiResponse({ status: 200, type: AuditItemDto })
  async approveItem(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() approveDto: ApproveAuditItemDto,
  ): Promise<AuditItemDto> {
    return this.auditSchedulesService.approve(itemId, approveDto, req.user.id);
  }

  @Post(':id/items/:itemId/reject')
  @ApiOperation({ summary: 'Reject audit item' })
  @ApiResponse({ status: 200, type: AuditItemDto })
  async rejectItem(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() rejectDto: RejectAuditItemDto,
  ): Promise<AuditItemDto> {
    return this.auditSchedulesService.reject(itemId, rejectDto, req.user.id);
  }

  @Get(':id/items/:itemId/approval-rights')
  @ApiOperation({ summary: 'Check approval rights for audit item' })
  @ApiResponse({ status: 200 })
  async checkApprovalRights(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    return this.auditSchedulesService.checkApprovalRights(itemId, req.user.id);
  }
}
