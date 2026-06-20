import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuditPeriodsService } from '../services/audit-periods.service';
import { CreateAuditPeriodDto, AuditPeriodDto } from '../dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import { Permissions } from '../../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../../shared/decorators/allow-options-bypass.decorator';

interface RequestWithUser extends ExpressRequest {
  user: { id: string; email: string; role: string };
}

@ApiTags('Audit Periods')
@ApiBearerAuth()
@Controller('audit-periods')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class AuditPeriodsController {
  constructor(private readonly auditPeriodsService: AuditPeriodsService) {}

  @Post()
  @Permissions('audit-period:create')
  @ApiOperation({ summary: 'Create a new audit period (auto-generates one audit per active element)' })
  @ApiResponse({ status: 201, type: AuditPeriodDto })
  async create(
    @Request() req: RequestWithUser,
    @Body() dto: CreateAuditPeriodDto,
  ): Promise<AuditPeriodDto> {
    return this.auditPeriodsService.create(dto, req.user.id);
  }

  @Get()
  @AllowOptionsBypass()
  @Permissions('audit-period:list')
  @ApiOperation({ summary: 'List all audit periods with pagination' })
  @ApiResponse({ status: 200, type: [AuditPeriodDto] })
  @ApiQuery({ name: 'options', required: false, type: Boolean })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('year') year?: number,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.auditPeriodsService.findAll({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      year: year ? +year : undefined,
      sortOrder,
    });
  }

  @Get('latest')
  @Permissions('audit-period:list')
  @ApiOperation({ summary: 'Get the latest audit period (highest year+month)' })
  @ApiResponse({ status: 200, type: AuditPeriodDto })
  async findLatest(): Promise<AuditPeriodDto | null> {
    return this.auditPeriodsService.findLatest();
  }

  @Get('element-count')
  @AllowOptionsBypass()
  @Permissions('audit-period:list')
  @ApiOperation({ summary: 'Count active audit elements (for create-form preview)' })
  @ApiResponse({ status: 200 })
  async countElements(): Promise<{ count: number }> {
    const count = await this.auditPeriodsService.countActiveElements();
    return { count };
  }

  @Get(':id')
  @Permissions('audit-period:read')
  @ApiOperation({ summary: 'Get a single audit period by ID' })
  @ApiResponse({ status: 200, type: AuditPeriodDto })
  async findOne(@Param('id') id: string): Promise<AuditPeriodDto> {
    return this.auditPeriodsService.findOne(id);
  }

  @Delete(':id')
  @Permissions('audit-period:delete')
  @ApiOperation({ summary: 'Soft-delete an audit period (blocked if items are filled)' })
  @ApiResponse({ status: 204 })
  async remove(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.auditPeriodsService.remove(id, req.user.id);
  }
}
