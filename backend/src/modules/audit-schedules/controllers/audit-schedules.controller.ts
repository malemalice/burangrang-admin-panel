import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GeneralStatusEnum } from '@prisma/client';
import { AuditSchedulesService } from '../services/audit-schedules.service';
import {
  CreateAuditScheduleDto,
  UpdateAuditScheduleDto,
  AuditScheduleDto,
} from '../dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';

// Define interface for request with user property
interface RequestWithUser extends ExpressRequest {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('Audit Schedules')
@ApiBearerAuth()
@Controller('audit-schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditSchedulesController {
  constructor(
    private readonly auditSchedulesService: AuditSchedulesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new audit schedule' })
  @ApiResponse({ status: 201, type: AuditScheduleDto })
  async create(
    @Request() req: RequestWithUser,
    @Body() createAuditScheduleDto: CreateAuditScheduleDto,
  ): Promise<AuditScheduleDto> {
    return this.auditSchedulesService.create(
      createAuditScheduleDto,
      req.user.id,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all audit schedules with pagination' })
  @ApiResponse({ status: 200, type: [AuditScheduleDto] })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: boolean,
    @Query('areaId') areaId?: string,
    @Query('auditElementId') auditElementId?: string,
    @Query('status') status?: GeneralStatusEnum,
  ) {
    return this.auditSchedulesService.findAll({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      sortBy,
      sortOrder,
      isActive,
      areaId,
      auditElementId,
      status,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an audit schedule by id' })
  @ApiResponse({ status: 200, type: AuditScheduleDto })
  async findOne(@Param('id') id: string): Promise<AuditScheduleDto> {
    return this.auditSchedulesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an audit schedule' })
  @ApiResponse({ status: 200, type: AuditScheduleDto })
  async update(
    @Param('id') id: string,
    @Body() updateAuditScheduleDto: UpdateAuditScheduleDto,
  ): Promise<AuditScheduleDto> {
    return this.auditSchedulesService.update(id, updateAuditScheduleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an audit schedule' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id') id: string): Promise<void> {
    return this.auditSchedulesService.remove(id);
  }
}
