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
} from '@nestjs/common';
import { WaterQualityParametersService } from '../services/water-quality-parameters.service';
import {
  CreateWaterQualityParameterDto,
  UpdateWaterQualityParameterDto,
  WaterQualityParameterDto,
} from '../dto/water-quality-parameters';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import { Permissions } from '../../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../../shared/decorators/allow-options-bypass.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('water-quality-parameters')
@ApiBearerAuth()
@Controller('water-quality-parameters')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class WaterQualityParametersController {
  constructor(private readonly service: WaterQualityParametersService) {}

  @Post()
  @Permissions('waste-management:create')
  @ApiOperation({ summary: 'Create a new water quality parameter' })
  @ApiBody({ type: CreateWaterQualityParameterDto })
  @ApiResponse({
    status: 201,
    description: 'The parameter has been successfully created.',
    type: WaterQualityParameterDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  create(
    @Body() createDto: CreateWaterQualityParameterDto,
  ): Promise<WaterQualityParameterDto> {
    return this.service.create(createDto);
  }

  @Get()
  @AllowOptionsBypass()
  @Permissions('waste-management:list')
  @ApiOperation({ summary: 'Get all water quality parameters with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'dateSampleTakenFrom', required: false, type: String, description: 'ISO date string (inclusive)' })
  @ApiQuery({ name: 'dateSampleTakenTo', required: false, type: String, description: 'ISO date string (inclusive)' })
  @ApiQuery({
    name: 'options',
    required: false,
    type: Boolean,
    description:
      'Set to true to bypass permission check (requires JWT auth only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Return all parameters.',
    type: [WaterQualityParameterDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('dateSampleTakenFrom') dateSampleTakenFrom?: string,
    @Query('dateSampleTakenTo') dateSampleTakenTo?: string,
  ): Promise<{ data: WaterQualityParameterDto[]; meta: { total: number } }> {
    return this.service.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      sortBy,
      sortOrder,
      isActive: isActive === undefined ? undefined : isActive === 'true',
      search,
      dateSampleTakenFrom,
      dateSampleTakenTo,
    });
  }

  @Get(':id')
  @Permissions('waste-management:read')
  @ApiOperation({ summary: 'Get a water quality parameter by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Return the parameter.',
    type: WaterQualityParameterDto,
  })
  @ApiResponse({ status: 404, description: 'Parameter not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string): Promise<WaterQualityParameterDto> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Permissions('waste-management:update')
  @ApiOperation({ summary: 'Update a water quality parameter' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateWaterQualityParameterDto })
  @ApiResponse({
    status: 200,
    description: 'The parameter has been successfully updated.',
    type: WaterQualityParameterDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Parameter not found' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateWaterQualityParameterDto,
  ): Promise<WaterQualityParameterDto> {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  @Permissions('waste-management:delete')
  @ApiOperation({ summary: 'Delete a water quality parameter' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'The parameter has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Parameter not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
