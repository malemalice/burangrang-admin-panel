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
import { AuditCriteriaService } from '../services/audit-criteria.service';
import { CreateAuditCriteriaDto } from '../dto/create-audit-criteria.dto';
import { UpdateAuditCriteriaDto } from '../dto/update-audit-criteria.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { Role } from '../../../shared/types/role.enum';
import { AuditCriteriaDto } from '../dto/audit-criteria.dto';
import { TransitionTypeEnum } from '@prisma/client';

@ApiTags('audit-criteria')
@ApiBearerAuth()
@Controller('audit-criteria')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditCriteriaController {
  constructor(private readonly auditCriteriaService: AuditCriteriaService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new audit criteria' })
  @ApiResponse({
    status: 201,
    description: 'The audit criteria has been successfully created.',
    type: AuditCriteriaDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  create(
    @Body() createAuditCriteriaDto: CreateAuditCriteriaDto,
  ): Promise<AuditCriteriaDto> {
    return this.auditCriteriaService.create(createAuditCriteriaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all audit criteria' })
  @ApiResponse({
    status: 200,
    description: 'Return all audit criteria.',
    type: [AuditCriteriaDto],
  })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('auditClauseId') auditClauseId?: string,
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
      transitionType: transitionTypeEnum,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an audit criteria by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the audit criteria.',
    type: AuditCriteriaDto,
  })
  @ApiResponse({ status: 404, description: 'Audit criteria not found.' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  findOne(@Param('id') id: string): Promise<AuditCriteriaDto> {
    return this.auditCriteriaService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
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
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Delete an audit criteria' })
  @ApiResponse({
    status: 200,
    description: 'The audit criteria has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Audit criteria not found.' })
  remove(@Param('id') id: string): Promise<void> {
    return this.auditCriteriaService.remove(id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get an audit criteria by code' })
  @ApiResponse({
    status: 200,
    description: 'Return the audit criteria.',
    type: AuditCriteriaDto,
  })
  @ApiResponse({ status: 404, description: 'Audit criteria not found.' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  findByCode(@Param('code') code: string): Promise<AuditCriteriaDto> {
    return this.auditCriteriaService.findByCode(code);
  }

  @Post('regenerate-codes/:auditClauseId')
  @ApiOperation({ summary: 'Regenerate codes for all criteria in an audit clause' })
  @ApiResponse({
    status: 200,
    description: 'Codes have been successfully regenerated.',
  })
  @ApiResponse({ status: 404, description: 'Audit clause not found.' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async regenerateCodes(@Param('auditClauseId') auditClauseId: string): Promise<{ message: string }> {
    await this.auditCriteriaService.regenerateCriteriaCodes(auditClauseId);
    return { message: 'Codes regenerated successfully' };
  }
}
