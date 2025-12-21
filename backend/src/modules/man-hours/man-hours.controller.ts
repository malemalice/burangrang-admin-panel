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
import { ManHoursService } from './man-hours.service';
import { CreateManHourDto } from './dto/create-man-hour.dto';
import { UpdateManHourDto } from './dto/update-man-hour.dto';
import { ManHourDto, ManHourReportDto } from './dto/man-hour.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ManHourGroupEnum, MonthEnum } from '@prisma/client';

@ApiTags('man-hours')
@ApiBearerAuth()
@Controller('man-hours')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ManHoursController {
  constructor(private readonly manHoursService: ManHoursService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new man hour record' })
  @ApiResponse({ status: 201, description: 'The man hour has been successfully created.', type: ManHourDto })
  create(
    @Body() createDto: CreateManHourDto,
    @Request() req: any,
  ): Promise<ManHourDto> {
    return this.manHoursService.create(createDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all man hours with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'month', required: false, enum: MonthEnum })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'group', required: false, enum: ManHourGroupEnum })
  @ApiResponse({ status: 200, description: 'Return all man hours.', type: [ManHourDto] })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('month') month?: MonthEnum,
    @Query('year') year?: string,
    @Query('group') group?: ManHourGroupEnum,
  ): Promise<{ data: ManHourDto[]; meta: { total: number } }> {
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const yearNumber = year ? parseInt(year, 10) : undefined;
    const isActiveBoolean = isActive === undefined ? undefined : isActive === 'true';

    return this.manHoursService.findAll({
      page: pageNumber,
      limit: limitNumber,
      sortBy,
      sortOrder,
      isActive: isActiveBoolean,
      search,
      month,
      year: yearNumber,
      group,
    });
  }

  @Get('report')
  @ApiOperation({ summary: 'Get man hour report data' })
  @ApiQuery({ name: 'startYear', required: true, type: Number })
  @ApiQuery({ name: 'endYear', required: true, type: Number })
  @ApiQuery({ name: 'group', required: false, enum: ManHourGroupEnum })
  @ApiResponse({ status: 200, description: 'Return aggregated man hour report.', type: ManHourReportDto })
  getReport(
    @Query('startYear') startYear: string,
    @Query('endYear') endYear: string,
    @Query('group') group?: ManHourGroupEnum,
  ): Promise<ManHourReportDto> {
    return this.manHoursService.getReport({
      startYear: parseInt(startYear, 10),
      endYear: parseInt(endYear, 10),
      group,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a man hour by id' })
  @ApiResponse({ status: 200, description: 'Return the man hour.', type: ManHourDto })
  @ApiResponse({ status: 404, description: 'Man hour not found.' })
  findOne(@Param('id') id: string): Promise<ManHourDto> {
    return this.manHoursService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a man hour' })
  @ApiResponse({ status: 200, description: 'The man hour has been successfully updated.', type: ManHourDto })
  @ApiResponse({ status: 404, description: 'Man hour not found.' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateManHourDto,
  ): Promise<ManHourDto> {
    return this.manHoursService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a man hour' })
  @ApiResponse({ status: 200, description: 'The man hour has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Man hour not found.' })
  remove(@Param('id') id: string): Promise<void> {
    return this.manHoursService.remove(id);
  }
}
