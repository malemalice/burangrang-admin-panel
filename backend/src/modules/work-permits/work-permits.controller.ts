import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WorkPermitsService } from './work-permits.service';
import { CreateWorkPermitDto } from './dto/create-work-permit.dto';
import { UpdateWorkPermitDto } from './dto/update-work-permit.dto';
import { WorkPermitDto } from './dto/work-permit.dto';
import { FindWorkPermitsDto } from './dto/find-work-permits.dto';
import { SubmitWorkPermitDto } from './dto/submit-work-permit.dto';
import { ApproveWorkPermitDto } from './dto/approve-work-permit.dto';
import { RejectWorkPermitDto } from './dto/reject-work-permit.dto';
import { RequestInfoWorkPermitDto } from './dto/request-info-work-permit.dto';
import { ExtendWorkPermitDto } from './dto/extend-work-permit.dto';
import { CloseWorkPermitDto } from './dto/close-work-permit.dto';
import { PaginatedResponse } from '../../shared/types/pagination-params';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/types/role.enum';

@ApiTags('work-permits')
@ApiBearerAuth()
@Controller('work-permits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkPermitsController {
  constructor(private readonly workPermitsService: WorkPermitsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new work permit' })
  @ApiBody({ type: CreateWorkPermitDto })
  @ApiResponse({
    status: 201,
    description: 'Work permit created successfully',
    type: WorkPermitDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  async create(
    @Body() createWorkPermitDto: CreateWorkPermitDto,
    @Request() req,
  ): Promise<WorkPermitDto> {
    return this.workPermitsService.create(createWorkPermitDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all work permits with pagination and filtering' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in work permit code or project name',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort field (code, projectName, proposedStartDate, proposedEndDate, status, createdAt, updatedAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'companyId',
    required: false,
    type: String,
    description: 'Filter by company ID',
  })
  @ApiQuery({
    name: 'areaId',
    required: false,
    type: String,
    description: 'Filter by area ID',
  })
  @ApiQuery({
    name: 'createdBy',
    required: false,
    type: String,
    description: 'Filter by creator user ID',
  })
  @ApiQuery({
    name: 'startDateFrom',
    required: false,
    type: String,
    description: 'Filter by start date (from)',
  })
  @ApiQuery({
    name: 'startDateTo',
    required: false,
    type: String,
    description: 'Filter by start date (to)',
  })
  @ApiQuery({
    name: 'endDateFrom',
    required: false,
    type: String,
    description: 'Filter by end date (from)',
  })
  @ApiQuery({
    name: 'endDateTo',
    required: false,
    type: String,
    description: 'Filter by end date (to)',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiResponse({
    status: 200,
    description: 'Work permits retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/WorkPermitDto' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  async findAll(@Query() query: FindWorkPermitsDto): Promise<PaginatedResponse<WorkPermitDto>> {
    return this.workPermitsService.findAll(query);
  }

  @Get('master-data')
  @ApiOperation({ summary: 'Get master data for work permit form' })
  @ApiResponse({
    status: 200,
    description: 'Master data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        areas: { type: 'array' },
        companies: { type: 'array' },
        workClassifications: { type: 'array' },
        guests: { type: 'array' },
        heavyEquipment: { type: 'array' },
        tools: { type: 'array' },
        materials: { type: 'array' },
        machines: { type: 'array' },
        professions: { type: 'array' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  async getMasterData() {
    return this.workPermitsService.getMasterData();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a work permit by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Work permit ID' })
  @ApiResponse({
    status: 200,
    description: 'Work permit retrieved successfully',
    type: WorkPermitDto,
  })
  @ApiResponse({ status: 404, description: 'Work permit not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  async findOne(@Param('id') id: string): Promise<WorkPermitDto> {
    return this.workPermitsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a work permit' })
  @ApiParam({ name: 'id', type: String, description: 'Work permit ID' })
  @ApiBody({ type: UpdateWorkPermitDto })
  @ApiResponse({
    status: 200,
    description: 'Work permit updated successfully',
    type: WorkPermitDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or invalid status for editing' })
  @ApiResponse({ status: 404, description: 'Work permit not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  async update(
    @Param('id') id: string,
    @Body() updateWorkPermitDto: UpdateWorkPermitDto,
    @Request() req,
  ): Promise<WorkPermitDto> {
    return this.workPermitsService.update(id, updateWorkPermitDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a work permit (soft delete)' })
  @ApiParam({ name: 'id', type: String, description: 'Work permit ID' })
  @ApiResponse({ status: 200, description: 'Work permit deleted successfully' })
  @ApiResponse({ status: 404, description: 'Work permit not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  async remove(@Param('id') id: string): Promise<void> {
    return this.workPermitsService.remove(id);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit work permit for approval' })
  @ApiParam({ name: 'id', type: String, description: 'Work permit ID' })
  @ApiBody({ type: SubmitWorkPermitDto })
  @ApiResponse({
    status: 200,
    description: 'Work permit submitted successfully',
    type: WorkPermitDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status for submission' })
  @ApiResponse({ status: 404, description: 'Work permit not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  async submit(
    @Param('id') id: string,
    @Body() submitDto: SubmitWorkPermitDto,
    @Request() req,
  ): Promise<WorkPermitDto> {
    return this.workPermitsService.submit(id, submitDto, req.user.id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve work permit (HSE or Security)' })
  @ApiParam({ name: 'id', type: String, description: 'Work permit ID' })
  @ApiBody({ type: ApproveWorkPermitDto })
  @ApiResponse({
    status: 200,
    description: 'Work permit approved successfully',
    type: WorkPermitDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status for approval' })
  @ApiResponse({ status: 404, description: 'Work permit not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  async approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveWorkPermitDto,
    @Request() req,
  ): Promise<WorkPermitDto> {
    return this.workPermitsService.approve(id, approveDto, req.user.id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject work permit' })
  @ApiParam({ name: 'id', type: String, description: 'Work permit ID' })
  @ApiBody({ type: RejectWorkPermitDto })
  @ApiResponse({
    status: 200,
    description: 'Work permit rejected successfully',
    type: WorkPermitDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status for rejection' })
  @ApiResponse({ status: 404, description: 'Work permit not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  async reject(
    @Param('id') id: string,
    @Body() rejectDto: RejectWorkPermitDto,
    @Request() req,
  ): Promise<WorkPermitDto> {
    return this.workPermitsService.reject(id, rejectDto, req.user.id);
  }

  @Post(':id/request-info')
  @ApiOperation({ summary: 'Request additional information from requester (HSE only)' })
  @ApiParam({ name: 'id', type: String, description: 'Work permit ID' })
  @ApiBody({ type: RequestInfoWorkPermitDto })
  @ApiResponse({
    status: 200,
    description: 'Information request sent successfully',
    type: WorkPermitDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status for requesting info' })
  @ApiResponse({ status: 404, description: 'Work permit not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  async requestInfo(
    @Param('id') id: string,
    @Body() requestInfoDto: RequestInfoWorkPermitDto,
    @Request() req,
  ): Promise<WorkPermitDto> {
    return this.workPermitsService.requestInfo(id, requestInfoDto, req.user.id);
  }

  @Post(':id/extend')
  @ApiOperation({ summary: 'Extend work permit end date' })
  @ApiParam({ name: 'id', type: String, description: 'Work permit ID' })
  @ApiBody({ type: ExtendWorkPermitDto })
  @ApiResponse({
    status: 200,
    description: 'Work permit extended successfully',
    type: WorkPermitDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status for extension or invalid date' })
  @ApiResponse({ status: 404, description: 'Work permit not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  async extend(
    @Param('id') id: string,
    @Body() extendDto: ExtendWorkPermitDto,
    @Request() req,
  ): Promise<WorkPermitDto> {
    return this.workPermitsService.extend(id, extendDto, req.user.id);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Close completed work permit' })
  @ApiParam({ name: 'id', type: String, description: 'Work permit ID' })
  @ApiBody({ type: CloseWorkPermitDto })
  @ApiResponse({
    status: 200,
    description: 'Work permit closed successfully',
    type: WorkPermitDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status for closure' })
  @ApiResponse({ status: 404, description: 'Work permit not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  async close(
    @Param('id') id: string,
    @Body() closeDto: CloseWorkPermitDto,
    @Request() req,
  ): Promise<WorkPermitDto> {
    return this.workPermitsService.close(id, closeDto, req.user.id);
  }

  @Get(':id/approval-rights')
  @ApiOperation({ summary: 'Check approval rights for the current user' })
  @ApiResponse({ status: 200, description: 'Returns approval rights' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  async checkApprovalRights(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.workPermitsService.checkApprovalRights(id, req.user.id);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get approval timeline/history for work permit' })
  @ApiParam({ name: 'id', type: String, description: 'Work permit ID' })
  @ApiResponse({
    status: 200,
    description: 'Approval timeline retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          status: { type: 'string' },
          notes: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'object' },
          department: { type: 'object' },
          jobPosition: { type: 'object' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Work permit not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  async getTimeline(@Param('id') id: string): Promise<any[]> {
    return this.workPermitsService.getTimeline(id);
  }
}
