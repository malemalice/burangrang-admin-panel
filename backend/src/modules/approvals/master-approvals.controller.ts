import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { MasterApprovalsService } from './master-approvals.service';
import { CreateMasterApprovalDto } from './dto/create-master-approval.dto';
import { UpdateMasterApprovalDto } from './dto/update-master-approval.dto';
import { MasterApprovalDto } from './dto/master-approval.dto';

@Controller('master-approvals')
export class MasterApprovalsController {
  constructor(
    private readonly masterApprovalsService: MasterApprovalsService,
  ) {}

  @Post()
  create(
    @Body() createMasterApprovalDto: CreateMasterApprovalDto,
  ): Promise<MasterApprovalDto> {
    return this.masterApprovalsService.create(createMasterApprovalDto);
  }

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: boolean,
    @Query('search') search?: string,
  ) {
    return this.masterApprovalsService.findAll({
      page,
      limit,
      sortBy,
      sortOrder,
      isActive,
      search,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<MasterApprovalDto> {
    return this.masterApprovalsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMasterApprovalDto: UpdateMasterApprovalDto,
  ): Promise<MasterApprovalDto> {
    return this.masterApprovalsService.update(id, updateMasterApprovalDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.masterApprovalsService.remove(id);
  }
}
