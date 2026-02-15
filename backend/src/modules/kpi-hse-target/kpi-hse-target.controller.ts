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
import { KpiHseTargetService } from './kpi-hse-target.service';
import { CreateHseTargetDto } from './dto/create-hse-target.dto';
import { UpdateHseTargetDto } from './dto/update-hse-target.dto';
import { HseTargetDto } from './dto/hse-target.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../shared/decorators/allow-options-bypass.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { HseTargetTypeEnum, MonthEnum } from '@prisma/client';

@ApiTags('kpi-hse-targets')
@ApiBearerAuth()
@Controller('kpi-hse-targets')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class KpiHseTargetController {
  constructor(private readonly kpiHseTargetService: KpiHseTargetService) {}

  @Post()
  @Permissions('kpi-hse-target:create')
  @ApiOperation({ summary: 'Create a new HSE target' })
  @ApiResponse({ status: 201, description: 'The HSE target has been successfully created.', type: HseTargetDto })
  create(
    @Body() createDto: CreateHseTargetDto,
    @Request() req: any,
  ): Promise<HseTargetDto> {
    return this.kpiHseTargetService.create(createDto, req.user.id);
  }

  @Get()
  @AllowOptionsBypass()
  @Permissions('kpi-hse-target:list')
  @ApiOperation({ summary: 'Get all HSE targets with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: HseTargetTypeEnum })
  @ApiQuery({ name: 'code', required: false, type: String })
  @ApiQuery({ name: 'month', required: false, enum: MonthEnum })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })
  @ApiResponse({ status: 200, description: 'Return all HSE targets.', type: [HseTargetDto] })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('type') type?: HseTargetTypeEnum,
    @Query('code') code?: string,
    @Query('month') month?: MonthEnum,
    @Query('year') year?: string,
  ): Promise<{ data: HseTargetDto[]; meta: { total: number; page: number; limit: number } }> {
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const yearNumber = year ? parseInt(year, 10) : undefined;
    const isActiveBoolean = isActive === undefined ? undefined : isActive === 'true';

    return this.kpiHseTargetService.findAll({
      page: pageNumber,
      limit: limitNumber,
      sortBy,
      sortOrder,
      isActive: isActiveBoolean,
      search,
      type,
      code,
      month,
      year: yearNumber,
    });
  }

  @Get(':id')
  @Permissions('kpi-hse-target:read')
  @ApiOperation({ summary: 'Get an HSE target by id' })
  @ApiResponse({ status: 200, description: 'Return the HSE target.', type: HseTargetDto })
  @ApiResponse({ status: 404, description: 'HSE target not found.' })
  findOne(@Param('id') id: string): Promise<HseTargetDto> {
    return this.kpiHseTargetService.findOne(id);
  }

  @Patch(':id')
  @Permissions('kpi-hse-target:update')
  @ApiOperation({ summary: 'Update an HSE target' })
  @ApiResponse({ status: 200, description: 'The HSE target has been successfully updated.', type: HseTargetDto })
  @ApiResponse({ status: 404, description: 'HSE target not found.' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateHseTargetDto,
  ): Promise<HseTargetDto> {
    return this.kpiHseTargetService.update(id, updateDto);
  }

  @Delete(':id')
  @Permissions('kpi-hse-target:delete')
  @ApiOperation({ summary: 'Delete an HSE target' })
  @ApiResponse({ status: 200, description: 'The HSE target has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'HSE target not found.' })
  remove(@Param('id') id: string): Promise<void> {
    return this.kpiHseTargetService.remove(id);
  }
}
