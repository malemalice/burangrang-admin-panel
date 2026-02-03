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
import { TreatmentPlantsService } from '../services/treatment-plants.service';
import { CreateTreatmentPlantDto, UpdateTreatmentPlantDto, TreatmentPlantDto } from '../dto/treatment-plants';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import { Permissions } from '../../../shared/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('treatment-plants')
@ApiBearerAuth()
@Controller('treatment-plants')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class TreatmentPlantsController {
  constructor(private readonly treatmentPlantsService: TreatmentPlantsService) {}

  @Post()
  @Permissions('waste-management:create')
  @ApiOperation({ summary: 'Create a new treatment plant' })
  @ApiBody({ type: CreateTreatmentPlantDto })
  @ApiResponse({ status: 201, description: 'The treatment plant has been successfully created.', type: TreatmentPlantDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  create(
    @Body() createDto: CreateTreatmentPlantDto,
    @Request() req: any,
  ): Promise<TreatmentPlantDto> {
    return this.treatmentPlantsService.create(createDto, req.user.id);
  }

  @Get()
  @Permissions('waste-management:list')
  @ApiOperation({ summary: 'Get all treatment plants with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'officeId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return all treatment plants.', type: [TreatmentPlantDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('officeId') officeId?: string,
  ): Promise<{ data: TreatmentPlantDto[]; meta: { total: number } }> {
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const isActiveBoolean = isActive === undefined ? undefined : isActive === 'true';

    return this.treatmentPlantsService.findAll({
      page: pageNumber,
      limit: limitNumber,
      sortBy,
      sortOrder,
      isActive: isActiveBoolean,
      search,
      officeId,
    });
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Get a treatment plant by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Return the treatment plant.', type: TreatmentPlantDto })
  @ApiResponse({ status: 404, description: 'Treatment plant not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string): Promise<TreatmentPlantDto> {
    return this.treatmentPlantsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('waste-management:update')
  @ApiOperation({ summary: 'Update a treatment plant' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateTreatmentPlantDto })
  @ApiResponse({ status: 200, description: 'The treatment plant has been successfully updated.', type: TreatmentPlantDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Treatment plant not found.' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTreatmentPlantDto,
  ): Promise<TreatmentPlantDto> {
    return this.treatmentPlantsService.update(id, updateDto);
  }

  @Delete(':id')
  @Permissions('waste-management:delete')
  @ApiOperation({ summary: 'Delete a treatment plant' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'The treatment plant has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Treatment plant not found.' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  remove(@Param('id') id: string): Promise<void> {
    return this.treatmentPlantsService.remove(id);
  }
}
