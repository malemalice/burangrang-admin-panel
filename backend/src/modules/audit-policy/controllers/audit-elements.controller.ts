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
import { AuditElementsService } from '../services/audit-elements.service';
import { CreateAuditElementDto } from '../dto/create-audit-element.dto';
import { UpdateAuditElementDto } from '../dto/update-audit-element.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import { Permissions } from '../../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../../shared/decorators/allow-options-bypass.decorator';
import { AuditElementDto } from '../dto/audit-element.dto';

@ApiTags('audit-elements')
@ApiBearerAuth()
@Controller('audit-elements')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class AuditElementsController {
  constructor(private readonly auditElementsService: AuditElementsService) {}

  @Post()
  @Permissions('audit-policy:create')
  @ApiOperation({ summary: 'Create a new audit element' })
  @ApiResponse({
    status: 201,
    description: 'The audit element has been successfully created.',
    type: AuditElementDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  create(
    @Body() createAuditElementDto: CreateAuditElementDto,
  ): Promise<AuditElementDto> {
    return this.auditElementsService.create(createAuditElementDto);
  }

  @Get()
  @AllowOptionsBypass()
  @Permissions('audit-policy:list')
  @ApiOperation({ summary: 'Get all audit elements' })
  @ApiResponse({
    status: 200,
    description: 'Return all audit elements.',
    type: [AuditElementDto],
  })
  @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('code') code?: string,
  ): Promise<{ data: AuditElementDto[]; meta: { total: number } }> {
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const isActiveBoolean =
      isActive === undefined ? undefined : isActive === 'true';

    return this.auditElementsService.findAll({
      page: pageNumber,
      limit: limitNumber,
      sortBy,
      sortOrder,
      isActive: isActiveBoolean,
      search,
      code,
    });
  }

  @Get(':id')
  @Permissions('audit-policy:read')
  @ApiOperation({ summary: 'Get an audit element by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the audit element.',
    type: AuditElementDto,
  })
  @ApiResponse({ status: 404, description: 'Audit element not found.' })
  
  findOne(@Param('id') id: string): Promise<AuditElementDto> {
    return this.auditElementsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('audit-policy:update')
  @ApiOperation({ summary: 'Update an audit element' })
  @ApiResponse({
    status: 200,
    description: 'The audit element has been successfully updated.',
    type: AuditElementDto,
  })
  @ApiResponse({ status: 404, description: 'Audit element not found.' })
  update(
    @Param('id') id: string,
    @Body() updateAuditElementDto: UpdateAuditElementDto,
  ): Promise<AuditElementDto> {
    return this.auditElementsService.update(id, updateAuditElementDto);
  }

  @Delete(':id')
  @Permissions('audit-policy:delete')
  @ApiOperation({ summary: 'Delete an audit element' })
  @ApiResponse({
    status: 200,
    description: 'The audit element has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Audit element not found.' })
  remove(@Param('id') id: string): Promise<void> {
    return this.auditElementsService.remove(id);
  }

  @Get('code/:code')
  @Permissions('audit-policy:read')
  @ApiOperation({ summary: 'Get an audit element by code' })
  @ApiResponse({
    status: 200,
    description: 'Return the audit element.',
    type: AuditElementDto,
  })
  @ApiResponse({ status: 404, description: 'Audit element not found.' })
  
  findByCode(@Param('code') code: string): Promise<AuditElementDto> {
    return this.auditElementsService.findByCode(code);
  }
}
