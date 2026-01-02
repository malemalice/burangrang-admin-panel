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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { Role } from '../../../shared/types/role.enum';
import { AuditElementDto } from '../dto/audit-element.dto';

@ApiTags('audit-elements')
@ApiBearerAuth()
@Controller('audit-elements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditElementsController {
  constructor(private readonly auditElementsService: AuditElementsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new audit element' })
  @ApiResponse({
    status: 201,
    description: 'The audit element has been successfully created.',
    type: AuditElementDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  create(
    @Body() createAuditElementDto: CreateAuditElementDto,
  ): Promise<AuditElementDto> {
    return this.auditElementsService.create(createAuditElementDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all audit elements' })
  @ApiResponse({
    status: 200,
    description: 'Return all audit elements.',
    type: [AuditElementDto],
  })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
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
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an audit element by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the audit element.',
    type: AuditElementDto,
  })
  @ApiResponse({ status: 404, description: 'Audit element not found.' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  findOne(@Param('id') id: string): Promise<AuditElementDto> {
    return this.auditElementsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
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
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
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
  @ApiOperation({ summary: 'Get an audit element by code' })
  @ApiResponse({
    status: 200,
    description: 'Return the audit element.',
    type: AuditElementDto,
  })
  @ApiResponse({ status: 404, description: 'Audit element not found.' })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  findByCode(@Param('code') code: string): Promise<AuditElementDto> {
    return this.auditElementsService.findByCode(code);
  }
}
