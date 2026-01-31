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
import { AuditClausesService } from '../services/audit-clauses.service';
import { CreateAuditClauseDto } from '../dto/create-audit-clause.dto';
import { UpdateAuditClauseDto } from '../dto/update-audit-clause.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { Role } from '../../../shared/types/role.enum';
import { AuditClauseDto } from '../dto/audit-clause.dto';

@ApiTags('audit-clauses')
@ApiBearerAuth()
@Controller('audit-clauses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditClausesController {
  constructor(private readonly auditClausesService: AuditClausesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new audit clause' })
  @ApiResponse({
    status: 201,
    description: 'The audit clause has been successfully created.',
    type: AuditClauseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  create(
    @Body() createAuditClauseDto: CreateAuditClauseDto,
  ): Promise<AuditClauseDto> {
    return this.auditClausesService.create(createAuditClauseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all audit clauses' })
  @ApiResponse({
    status: 200,
    description: 'Return all audit clauses.',
    type: [AuditClauseDto],
  })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('auditElementId') auditElementId?: string,
  ): Promise<{ data: AuditClauseDto[]; meta: { total: number } }> {
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const isActiveBoolean =
      isActive === undefined ? undefined : isActive === 'true';

    return this.auditClausesService.findAll({
      page: pageNumber,
      limit: limitNumber,
      sortBy,
      sortOrder,
      isActive: isActiveBoolean,
      search,
      auditElementId,
    });
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reorder clauses within an audit element' })
  @ApiResponse({
    status: 200,
    description: 'Clauses reordered successfully.',
  })
  @ApiResponse({ status: 404, description: 'Audit element not found.' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async reorder(
    @Body() body: { auditElementId: string; clauseIds: string[] },
  ): Promise<{ message: string }> {
    await this.auditClausesService.reorder(body.auditElementId, body.clauseIds);
    return { message: 'Clause reordered successfully' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an audit clause by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the audit clause.',
    type: AuditClauseDto,
  })
  @ApiResponse({ status: 404, description: 'Audit clause not found.' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  findOne(@Param('id') id: string): Promise<AuditClauseDto> {
    return this.auditClausesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Update an audit clause' })
  @ApiResponse({
    status: 200,
    description: 'The audit clause has been successfully updated.',
    type: AuditClauseDto,
  })
  @ApiResponse({ status: 404, description: 'Audit clause not found.' })
  update(
    @Param('id') id: string,
    @Body() updateAuditClauseDto: UpdateAuditClauseDto,
  ): Promise<AuditClauseDto> {
    return this.auditClausesService.update(id, updateAuditClauseDto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Delete an audit clause' })
  @ApiResponse({
    status: 200,
    description: 'The audit clause has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Audit clause not found.' })
  remove(@Param('id') id: string): Promise<void> {
    return this.auditClausesService.remove(id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get an audit clause by code' })
  @ApiResponse({
    status: 200,
    description: 'Return the audit clause.',
    type: AuditClauseDto,
  })
  @ApiResponse({ status: 404, description: 'Audit clause not found.' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  findByCode(@Param('code') code: string): Promise<AuditClauseDto> {
    return this.auditClausesService.findByCode(code);
  }

  @Post('regenerate-codes/:auditElementId')
  @ApiOperation({ summary: 'Regenerate codes for all clauses in an audit element' })
  @ApiResponse({
    status: 200,
    description: 'Codes have been successfully regenerated.',
  })
  @ApiResponse({ status: 404, description: 'Audit element not found.' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async regenerateCodes(@Param('auditElementId') auditElementId: string): Promise<{ message: string }> {
    await this.auditClausesService.regenerateClauseCodes(auditElementId);
    return { message: 'Codes regenerated successfully' };
  }
}
