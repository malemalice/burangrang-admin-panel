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
} from '@nestjs/common';
import { MasterApprovalsService } from './master-approvals.service';
import { CreateMasterApprovalDto } from './dto/create-master-approval.dto';
import { UpdateMasterApprovalDto } from './dto/update-master-approval.dto';
import {
  ApprovalStatusHistory,
  MasterApprovalDto,
} from './dto/master-approval.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubmitApprovalDto } from './dto/submit-approval.dto';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { UserInterceptor } from '../../shared/interceptors/user.interceptor';

interface User {
  id: string;
  departmentId: string | null;
  jobPositionId: string | null;
  department?: {
    id: string;
    name: string;
  };
  jobPosition?: {
    id: string;
    name: string;
  };
}

@Controller('master-approvals')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(UserInterceptor)
export class MasterApprovalsController {
  constructor(
    private readonly masterApprovalsService: MasterApprovalsService,
  ) {}

  @Post()
  create(
    @CurrentUser() user: User,
    @Body() createMasterApprovalDto: CreateMasterApprovalDto,
  ): Promise<MasterApprovalDto> {
    return this.masterApprovalsService.create(createMasterApprovalDto, user.id);
  }

  @Get()
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
  findOne(@Param('id') id: string): Promise<MasterApprovalDto> {
    return this.masterApprovalsService.findOne(id);
  }

  @Get('check-approval/:dataId')
  @ApiOperation({
    summary: 'Check if current user has approval rights for a risk assessment',
  })
  @ApiResponse({ status: 200, type: Boolean })
  async checkApprovalRights(
    @CurrentUser() user: User,
    @Param('dataId') dataId: string,
  ): Promise<{ canApprove: boolean }> {
    return this.masterApprovalsService.checkApprovalRights(
      dataId,
      user,
      'RiskAssessment',
    );
  }

  @Get('check-approval-status/:dataId')
  @ApiOperation({
    summary: 'Check if current user has approval rights for a risk assessment',
  })
  @ApiResponse({ status: 200, type: Boolean })
  async checkApprovalStatus(
    @CurrentUser() user: User,
    @Param('dataId') dataId: string,
  ): Promise<ApprovalStatusHistory> {
    return this.masterApprovalsService.checkApprovalStatus(
      dataId,
      'RiskAssessment',
    );
  }

  @Patch(':id')
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
  remove(@Param('id') id: string): Promise<void> {
    return this.masterApprovalsService.remove(id);
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
