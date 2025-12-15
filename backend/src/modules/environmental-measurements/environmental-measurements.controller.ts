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
import { EnvironmentalMeasurementsService } from './environmental-measurements.service';
import { CreateEnvironmentalMeasurementDto } from './dto/create-environmental-measurement.dto';
import { UpdateEnvironmentalMeasurementDto } from './dto/update-environmental-measurement.dto';
import { EnvironmentalMeasurementDto } from './dto/environmental-measurement.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('environmental-measurements')
@ApiBearerAuth()
@Controller('environmental-measurements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnvironmentalMeasurementsController {
  constructor(private readonly measurementsService: EnvironmentalMeasurementsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new environmental measurement' })
  @ApiResponse({ status: 201, description: 'The measurement has been successfully created.', type: EnvironmentalMeasurementDto })
  create(
    @Body() createDto: CreateEnvironmentalMeasurementDto,
    @Request() req: any,
  ): Promise<EnvironmentalMeasurementDto> {
    return this.measurementsService.create(createDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all environmental measurements with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'roomId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return all environmental measurements.', type: [EnvironmentalMeasurementDto] })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('roomId') roomId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ data: EnvironmentalMeasurementDto[]; meta: { total: number } }> {
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const isActiveBoolean = isActive === undefined ? undefined : isActive === 'true';

    return this.measurementsService.findAll({
      page: pageNumber,
      limit: limitNumber,
      sortBy,
      sortOrder,
      isActive: isActiveBoolean,
      search,
      roomId,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an environmental measurement by id' })
  @ApiResponse({ status: 200, description: 'Return the environmental measurement.', type: EnvironmentalMeasurementDto })
  @ApiResponse({ status: 404, description: 'Environmental measurement not found.' })
  findOne(@Param('id') id: string): Promise<EnvironmentalMeasurementDto> {
    return this.measurementsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an environmental measurement' })
  @ApiResponse({ status: 200, description: 'The measurement has been successfully updated.', type: EnvironmentalMeasurementDto })
  @ApiResponse({ status: 404, description: 'Environmental measurement not found.' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateEnvironmentalMeasurementDto,
  ): Promise<EnvironmentalMeasurementDto> {
    return this.measurementsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an environmental measurement' })
  @ApiResponse({ status: 200, description: 'The measurement has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Environmental measurement not found.' })
  remove(@Param('id') id: string): Promise<void> {
    return this.measurementsService.remove(id);
  }
}
