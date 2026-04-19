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
import { SignSkWorkPermitDto } from './dto/sign-sk-work-permit.dto';
import { CreateProfessionDto } from './dto/create-profession.dto';
import { CreateToolDto } from './dto/create-tool.dto';
import { CreateMaterialDto } from './dto/create-material.dto';
import { CreateMachineDto } from './dto/create-machine.dto';
import { CreateHeavyEquipmentDto } from './dto/create-heavy-equipment.dto';
import { PaginatedResponse } from '../../shared/types/pagination-params';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { DataScopeGuard } from '../../shared/guards/data-scope.guard';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../shared/decorators/allow-options-bypass.decorator';
import { DataScoped } from '../../shared/decorators/data-scoped.decorator';

@ApiTags('work-permits')
@ApiBearerAuth()
@Controller('work-permits')
@DataScoped('WorkPermit')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, DataScopeGuard)
export class WorkPermitsController {
  constructor(private readonly workPermitsService: WorkPermitsService) { }

  @Post()
  @Permissions('work-permit:create')
  @ApiOperation({ summary: 'Create a new work permit' })
  @ApiBody({ type: CreateWorkPermitDto })
  @ApiResponse({
    status: 201,
    description: 'Work permit created successfully',
    type: WorkPermitDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createWorkPermitDto: CreateWorkPermitDto,
    @Request() req,
  ): Promise<WorkPermitDto> {
    return this.workPermitsService.create(createWorkPermitDto, req.user.id);
  }

  @Get()
  @AllowOptionsBypass()
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
  @ApiQuery({
    name: 'options',
    required: false,
    type: Boolean,
    description: 'Set to true to bypass permission check (requires JWT auth only)',
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
  @Permissions('work-permit:list')
  async findAll(
    @Query() query: FindWorkPermitsDto,
    @Request() req: any,
  ): Promise<PaginatedResponse<WorkPermitDto>> {
    return this.workPermitsService.findAll(query, req.userContext);
  }

  @Get('master-data')
  @AllowOptionsBypass()
  @Permissions('work-permit:read')
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
  async getMasterData() {
    return this.workPermitsService.getMasterData();
  }

  @Post('professions')
  @Permissions('work-permit:create')
  @ApiOperation({ summary: 'Create a profession (master data) for use on work permits' })
  @ApiBody({ type: CreateProfessionDto })
  @ApiResponse({ status: 201, description: 'Profession created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or duplicate code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createProfession(@Body() dto: CreateProfessionDto) {
    return this.workPermitsService.createProfession(dto);
  }

  @Post('tools')
  @Permissions('work-permit:create')
  @ApiOperation({ summary: 'Create a tool (master data) for use on work permits' })
  @ApiBody({ type: CreateToolDto })
  @ApiResponse({ status: 201, description: 'Tool created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or duplicate code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createTool(@Body() dto: CreateToolDto) {
    return this.workPermitsService.createTool(dto);
  }

  @Post('materials')
  @Permissions('work-permit:create')
  @ApiOperation({ summary: 'Create a material (master data) for use on work permits' })
  @ApiBody({ type: CreateMaterialDto })
  @ApiResponse({ status: 201, description: 'Material created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or duplicate code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createMaterial(@Body() dto: CreateMaterialDto) {
    return this.workPermitsService.createMaterial(dto);
  }

  @Post('machines')
  @Permissions('work-permit:create')
  @ApiOperation({ summary: 'Create a machine (master data) for use on work permits' })
  @ApiBody({ type: CreateMachineDto })
  @ApiResponse({ status: 201, description: 'Machine created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or duplicate code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createMachine(@Body() dto: CreateMachineDto) {
    return this.workPermitsService.createMachine(dto);
  }

  @Post('heavy-equipment')
  @Permissions('work-permit:create')
  @ApiOperation({ summary: 'Create heavy equipment (master data) for use on work permits' })
  @ApiBody({ type: CreateHeavyEquipmentDto })
  @ApiResponse({ status: 201, description: 'Heavy equipment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or duplicate code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createHeavyEquipment(@Body() dto: CreateHeavyEquipmentDto, @Request() req: any) {
    return this.workPermitsService.createHeavyEquipment(dto, req.user.id);
  }

  @Get(':id')
  @Permissions('work-permit:read')
  @ApiOperation({ summary: 'Get a work permit by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Work permit ID' })
  @ApiResponse({
    status: 200,
    description: 'Work permit retrieved successfully',
    type: WorkPermitDto,
  })
  @ApiResponse({ status: 404, description: 'Work permit not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to this record' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<WorkPermitDto> {
    return this.workPermitsService.findOne(id, req.userContext);
  }

  @Patch(':id')
  @Permissions('work-permit:update')
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
  async update(
    @Param('id') id: string,
    @Body() updateWorkPermitDto: UpdateWorkPermitDto,
    @Request() req: any,
  ): Promise<WorkPermitDto> {
    return this.workPermitsService.update(id, updateWorkPermitDto, req.user.id, req.userContext);
  }

  @Delete(':id')
  @Permissions('work-permit:delete')
  @ApiOperation({ summary: 'Delete a work permit (soft delete)' })
  @ApiParam({ name: 'id', type: String, description: 'Work permit ID' })
  @ApiResponse({ status: 200, description: 'Work permit deleted successfully' })
  @ApiResponse({ status: 404, description: 'Work permit not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to this record' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<void> {
    return this.workPermitsService.remove(id, req.userContext);
  }

  @Post(':id/submit')
  @Permissions('work-permit:update')
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
  async submit(
    @Param('id') id: string,
    @Body() submitDto: SubmitWorkPermitDto,
    @Request() req: any,
  ): Promise<WorkPermitDto> {
    return this.workPermitsService.submit(id, submitDto, req.user.id, req.userContext);
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
  async approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveWorkPermitDto,
    @Request() req: any,
  ): Promise<WorkPermitDto> {
    return this.workPermitsService.approve(id, approveDto, req.user.id, req.userContext);
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
  async reject(
    @Param('id') id: string,
    @Body() rejectDto: RejectWorkPermitDto,
    @Request() req: any,
  ): Promise<WorkPermitDto> {
    return this.workPermitsService.reject(id, rejectDto, req.user.id, req.userContext);
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
  async requestInfo(
    @Param('id') id: string,
    @Body() requestInfoDto: RequestInfoWorkPermitDto,
    @Request() req: any,
  ): Promise<WorkPermitDto> {
    return this.workPermitsService.requestInfo(id, requestInfoDto, req.user.id, req.userContext);
  }

  @Post(':id/sign-sk')
  @Permissions('work-permit:update')
  @ApiOperation({ summary: 'Applicant acknowledges and signs HSE safety guideline (SK)' })
  @ApiParam({ name: 'id', type: String, description: 'Work permit ID' })
  @ApiBody({ type: SignSkWorkPermitDto })
  @ApiResponse({
    status: 200,
    description: 'Safety guideline signed successfully',
    type: WorkPermitDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status for signing SK' })
  @ApiResponse({ status: 403, description: 'Only applicant can sign SK' })
  @ApiResponse({ status: 404, description: 'Work permit not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async signSk(
    @Param('id') id: string,
    @Body() signSkDto: SignSkWorkPermitDto,
    @Request() req: any,
  ): Promise<WorkPermitDto> {
    return this.workPermitsService.signSk(id, signSkDto, req.user.id, req.userContext);
  }

  @Post(':id/extend')
  @Permissions('work-permit:update')
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
  async extend(
    @Param('id') id: string,
    @Body() extendDto: ExtendWorkPermitDto,
    @Request() req: any,
  ): Promise<WorkPermitDto> {
    return this.workPermitsService.extend(id, extendDto, req.user.id, req.userContext);
  }

  @Post(':id/close')
  @Permissions('work-permit:update')
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
  async close(
    @Param('id') id: string,
    @Body() closeDto: CloseWorkPermitDto,
    @Request() req: any,
  ): Promise<WorkPermitDto> {
    return this.workPermitsService.close(id, closeDto, req.user.id, req.userContext);
  }

  @Get(':id/approval-rights')
  @ApiOperation({ summary: 'Check approval rights for the current user' })
  @ApiResponse({ status: 200, description: 'Returns approval rights' })
  async checkApprovalRights(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.workPermitsService.checkApprovalRights(id, req.user.id, req.userContext);
  }

  @Get(':id/timeline')
  @Permissions('work-permit:read')
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
  @ApiResponse({ status: 403, description: 'Forbidden - no access to this record' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTimeline(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<any[]> {
    return this.workPermitsService.getTimeline(id, req.userContext);
  }
}
