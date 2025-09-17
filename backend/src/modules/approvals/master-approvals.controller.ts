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
import { MasterApprovalDto } from './dto/master-approval.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/types/role.enum';

@ApiTags('master-approvals')
@ApiBearerAuth()
@Controller('master-approvals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MasterApprovalsController {
  constructor(
    private readonly masterApprovalsService: MasterApprovalsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new master approval' })
  @ApiBody({ type: CreateMasterApprovalDto })
  @ApiResponse({
    status: 201,
    description: 'The master approval has been successfully created.',
    type: MasterApprovalDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error.' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  create(
    @Body() createMasterApprovalDto: CreateMasterApprovalDto,
  ): Promise<MasterApprovalDto> {
    return this.masterApprovalsService.create(createMasterApprovalDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all master approvals with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Field to sort by' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
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
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
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
  @ApiOperation({ summary: 'Get a master approval by ID' })
  @ApiParam({ name: 'id', description: 'Master Approval ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Return the master approval.',
    type: MasterApprovalDto,
  })
  @ApiResponse({ status: 404, description: 'Master approval not found.' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  findOne(@Param('id') id: string): Promise<MasterApprovalDto> {
    return this.masterApprovalsService.findOne(id);
  }

  @Patch(':id')
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
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateMasterApprovalDto: UpdateMasterApprovalDto,
  ): Promise<MasterApprovalDto> {
    return this.masterApprovalsService.update(id, updateMasterApprovalDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a master approval' })
  @ApiParam({ name: 'id', description: 'Master Approval ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'The master approval has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Master approval not found.' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  remove(@Param('id') id: string): Promise<void> {
    return this.masterApprovalsService.remove(id);
  }
}
