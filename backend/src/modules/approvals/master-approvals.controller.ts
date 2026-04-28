import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  HttpException,
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
import { MasterApprovalsService } from './master-approvals.service';
import { CreateMasterApprovalDto } from './dto/create-master-approval.dto';
import { UpdateMasterApprovalDto } from './dto/update-master-approval.dto';
import {
  ApprovalStatusHistory,
  MasterApprovalDto,
} from './dto/master-approval.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../shared/decorators/allow-options-bypass.decorator';
import { SubmitApprovalDto } from './dto/submit-approval.dto';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { UserInterceptor } from '../../shared/interceptors/user.interceptor';
import { User } from '../../shared/types';
import { APPROVAL_ENTITIES } from '../../shared/constants/approval-entities';

@ApiTags('master-approvals')
@ApiBearerAuth()
@Controller('master-approvals')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(UserInterceptor)
export class MasterApprovalsController {
  constructor(
    private readonly masterApprovalsService: MasterApprovalsService,
  ) {}

  @Post()
  @Permissions('master-approval:create')
  @ApiOperation({ summary: 'Create a new master approval' })
  @ApiBody({ type: CreateMasterApprovalDto })
  @ApiResponse({
    status: 201,
    description: 'The master approval has been successfully created.',
    type: MasterApprovalDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error.' })
  
  create(
    @CurrentUser() user: User,
    @Body() createMasterApprovalDto: CreateMasterApprovalDto,
  ): Promise<MasterApprovalDto> {
    return this.masterApprovalsService.create(createMasterApprovalDto, user.id);
  }

  @Get()
  @AllowOptionsBypass()
  @Permissions('master-approval:list')
  @ApiOperation({ summary: 'Get all master approvals with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Field to sort by' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
  @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })
  @ApiResponse({
    status: 200,
    description: 'Return paginated list of master approvals.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/MasterApprovalDto' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number', description: 'Total number of master approvals' },
          },
        },
      },
    },
  })
  
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const isActiveBoolean =
      isActive === undefined ? undefined : isActive === 'true';
    

    return this.masterApprovalsService.findAll({
      page: pageNumber,
      limit: limitNumber,
      sortBy,
      sortOrder,
      isActive: isActiveBoolean,
      search,
    });
  }

  @Get(':id')
  @Permissions('master-approval:read')
  @ApiOperation({ summary: 'Get a master approval by ID' })
  @ApiParam({ name: 'id', description: 'Master Approval ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Return the master approval.',
    type: MasterApprovalDto,
  })
  @ApiResponse({ status: 404, description: 'Master approval not found.' })
  
  findOne(@Param('id') id: string): Promise<MasterApprovalDto> {
    return this.masterApprovalsService.findOne(id);
  }

  @Get('check-approval/:dataId')
  @ApiOperation({
    summary: 'Check if current user has approval rights for an entity',
  })
  @ApiQuery({
    name: 'entity',
    required: false,
    type: String,
    description:
      'Entity name (e.g., RISK_ASSESSMENT, WORK_PERMIT). Defaults to RISK_ASSESSMENT for backward compatibility.',
    enum: Object.values(APPROVAL_ENTITIES),
  })
  @ApiResponse({
    status: 200,
    description: 'Returns approval rights check result, always returns 200 even on errors',
    schema: {
      type: 'object',
      properties: {
        canApprove: { type: 'boolean' },
        error: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async checkApprovalRights(
    @CurrentUser() user: User,
    @Param('dataId') dataId: string,
    @Query('entity') entity?: string,
  ): Promise<{ canApprove: boolean; error?: boolean; message?: string }> {
    try {
      const entityName = entity || APPROVAL_ENTITIES.RISK_ASSESSMENT;
      return await this.masterApprovalsService.checkApprovalRights(
        dataId,
        user,
        entityName,
      );
    } catch (error) {
      let errorMessage = 'An unexpected error occurred';
      if (error instanceof HttpException) {
        const response = error.getResponse();
        errorMessage =
          typeof response === 'string'
            ? response
            : (response as { message?: string }).message || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      return {
        canApprove: false,
        error: true,
        message: errorMessage,
      };
    }
  }

  @Get('check-approval-status/:dataId')
  @ApiOperation({
    summary: 'Check approval status for an entity',
  })
  @ApiQuery({
    name: 'entity',
    required: false,
    type: String,
    description:
      'Entity name (e.g., RISK_ASSESSMENT, WORK_PERMIT). Defaults to RISK_ASSESSMENT for backward compatibility.',
    enum: Object.values(APPROVAL_ENTITIES),
  })
  @ApiResponse({
    status: 200,
    description: 'Returns approval status, always returns 200 even on errors',
    schema: {
      type: 'object',
      properties: {
        history: {
          type: 'array',
          items: { type: 'object' },
        },
        nextApprover: { type: 'object', nullable: true },
        currentStatus: { type: 'string' },
        error: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async checkApprovalStatus(
    @CurrentUser() user: User,
    @Param('dataId') dataId: string,
    @Query('entity') entity?: string,
  ): Promise<ApprovalStatusHistory & { error?: boolean; message?: string }> {
    try {
      const entityName = entity || APPROVAL_ENTITIES.RISK_ASSESSMENT;
      const result = await this.masterApprovalsService.checkApprovalStatus(
        dataId,
        entityName,
      );
      return result;
    } catch (error) {
      let errorMessage = 'An unexpected error occurred';
      if (error instanceof HttpException) {
        const response = error.getResponse();
        errorMessage =
          typeof response === 'string'
            ? response
            : (response as { message?: string }).message || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      return {
        history: [],
        nextApprover: null,
        allApprovalLines: [],
        currentStatus: 'ERROR',
        error: true,
        message: errorMessage,
      };
    }
  }

  @Patch(':id')
  @Permissions('master-approval:update')
  @ApiOperation({ summary: 'Update a master approval' })
  @ApiParam({ name: 'id', description: 'Master Approval ID', type: String })
  @ApiBody({ type: UpdateMasterApprovalDto })
  @ApiResponse({
    status: 200,
    description: 'The master approval has been successfully updated.',
    type: MasterApprovalDto,
  })
  @ApiResponse({ status: 404, description: 'Master approval not found.' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error.' })
  
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateMasterApprovalDto: UpdateMasterApprovalDto,
  ): Promise<MasterApprovalDto> {
    return this.masterApprovalsService.update(
      id,
      updateMasterApprovalDto,
      user.id,
    );
  }

  @Delete(':id')
  @Permissions('master-approval:delete')
  @ApiOperation({ summary: 'Delete a master approval' })
  @ApiParam({ name: 'id', description: 'Master Approval ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'The master approval has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Master approval not found.' })
  
  remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.masterApprovalsService.remove(id, user.id);
  }

  @Post('approval')
  @ApiOperation({
    summary: 'Submit an approval for an entity',
  })
  @ApiResponse({
    status: 201,
    description: 'Approval submitted successfully',
  })
  async submitApproval(
    @CurrentUser() user: User,
    @Body() submitApprovalDto: SubmitApprovalDto,
  ) {
    return this.masterApprovalsService.submitApproval(submitApprovalDto, user);
  }
}
