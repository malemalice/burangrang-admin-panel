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
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AuditCriteriaService } from '../services/audit-criteria.service';
import { CreateAuditCriteriaDto } from '../dto/create-audit-criteria.dto';
import { UpdateAuditCriteriaDto } from '../dto/update-audit-criteria.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import { Permissions } from '../../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../../shared/decorators/allow-options-bypass.decorator';
import { AuditCriteriaDto } from '../dto/audit-criteria.dto';
import { TransitionTypeEnum } from '@prisma/client';

interface RequestWithUser extends Request {
  user: { id: string; email: string; role: string };
}

@ApiTags('audit-criteria')
@ApiBearerAuth()
@Controller('audit-criteria')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class AuditCriteriaController {
  constructor(private readonly auditCriteriaService: AuditCriteriaService) {}

  @Post()
  @Permissions('audit-criteria:create')
  @ApiOperation({ summary: 'Create a new audit criteria' })
  @ApiResponse({
    status: 201,
    description: 'The audit criteria has been successfully created.',
    type: AuditCriteriaDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  create(
    @Body() createAuditCriteriaDto: CreateAuditCriteriaDto,
  ): Promise<AuditCriteriaDto> {
    return this.auditCriteriaService.create(createAuditCriteriaDto);
  }

  @Get()
  @AllowOptionsBypass()
  @Permissions('audit-criteria:list')
  @ApiOperation({ summary: 'Get all audit criteria' })
  @ApiResponse({
    status: 200,
    description: 'Return all audit criteria.',
    type: [AuditCriteriaDto],
  })
  @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('auditClauseId') auditClauseId?: string,
    @Query('auditElementId') auditElementId?: string,
    @Query('transitionType') transitionType?: string,
  ): Promise<{ data: AuditCriteriaDto[]; meta: { total: number } }> {
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const isActiveBoolean =
      isActive === undefined ? undefined : isActive === 'true';
    const transitionTypeEnum = transitionType
      ? (transitionType as TransitionTypeEnum)
      : undefined;

    return this.auditCriteriaService.findAll({
      page: pageNumber,
      limit: limitNumber,
      sortBy,
      sortOrder,
      isActive: isActiveBoolean,
      search,
      auditClauseId,
      auditElementId,
      transitionType: transitionTypeEnum,
    });
  }

  @Post('reorder')
  @Permissions('audit-criteria:update')
  @ApiOperation({ summary: 'Reorder criteria within an audit clause' })
  @ApiResponse({
    status: 200,
    description: 'Criteria reordered successfully.',
  })
  @ApiResponse({ status: 404, description: 'Audit clause not found.' })
  
  async reorder(
    @Body() body: { auditClauseId: string; criterionIds: string[] },
  ): Promise<{ message: string }> {
    await this.auditCriteriaService.reorder(body.auditClauseId, body.criterionIds);
    return { message: 'Criteria reordered successfully' };
  }

  @Get(':id')
  @Permissions('audit-criteria:read')
  @ApiOperation({ summary: 'Get an audit criteria by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the audit criteria.',
    type: AuditCriteriaDto,
  })
  @ApiResponse({ status: 404, description: 'Audit criteria not found.' })
  
  findOne(@Param('id') id: string): Promise<AuditCriteriaDto> {
    return this.auditCriteriaService.findOne(id);
  }

  @Patch(':id')
  @Permissions('audit-criteria:update')
  @ApiOperation({ summary: 'Update an audit criteria' })
  @ApiResponse({
    status: 200,
    description: 'The audit criteria has been successfully updated.',
    type: AuditCriteriaDto,
  })
  @ApiResponse({ status: 404, description: 'Audit criteria not found.' })
  update(
    @Param('id') id: string,
    @Body() updateAuditCriteriaDto: UpdateAuditCriteriaDto,
  ): Promise<AuditCriteriaDto> {
    return this.auditCriteriaService.update(id, updateAuditCriteriaDto);
  }

  @Delete(':id')
  @Permissions('audit-criteria:delete')
  @ApiOperation({ summary: 'Delete an audit criteria' })
  @ApiResponse({
    status: 200,
    description: 'The audit criteria has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Audit criteria not found.' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser): Promise<void> {
    return this.auditCriteriaService.remove(id, req.user.id);
  }

  @Get('code/:code')
  @Permissions('audit-criteria:read')
  @ApiOperation({ summary: 'Get an audit criteria by code' })
  @ApiResponse({
    status: 200,
    description: 'Return the audit criteria.',
    type: AuditCriteriaDto,
  })
  @ApiResponse({ status: 404, description: 'Audit criteria not found.' })
  
  findByCode(@Param('code') code: string): Promise<AuditCriteriaDto> {
    return this.auditCriteriaService.findByCode(code);
  }

  @Post('regenerate-codes/:auditClauseId')
  @Permissions('audit-criteria:update')
  @ApiOperation({ summary: 'Regenerate codes for all criteria in an audit clause' })
  @ApiResponse({
    status: 200,
    description: 'Codes have been successfully regenerated.',
  })
  @ApiResponse({ status: 404, description: 'Audit clause not found.' })
  
  async regenerateCodes(@Param('auditClauseId') auditClauseId: string): Promise<{ message: string }> {
    await this.auditCriteriaService.regenerateCriteriaCodes(auditClauseId);
    return { message: 'Codes regenerated successfully' };
  }
}
