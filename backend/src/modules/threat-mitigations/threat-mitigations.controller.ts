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
import { ThreatMitigationsService } from './threat-mitigations.service';
import { CreateThreatMitigationDto } from './dto/create-threat-mitigation.dto';
import { UpdateThreatMitigationDto } from './dto/update-threat-mitigation.dto';
import { ThreatMitigationDto } from './dto/threat-mitigation.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('threat-mitigations')
@Controller('threat-mitigations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ThreatMitigationsController {
  constructor(private readonly threatMitigationsService: ThreatMitigationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new threat mitigation' })
  @ApiResponse({ status: 201, description: 'The threat mitigation has been successfully created.', type: ThreatMitigationDto })
  create(@Body() createThreatMitigationDto: CreateThreatMitigationDto): Promise<ThreatMitigationDto> {
    return this.threatMitigationsService.create(createThreatMitigationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all threat mitigations with pagination' })
  @ApiResponse({ status: 200, description: 'Return all threat mitigations.', type: [ThreatMitigationDto] })
  @ApiQuery({ name: 'threatId', required: false, description: 'Filter mitigations by threat ID' })
  @ApiQuery({ name: 'level', required: false, description: 'Filter mitigations by level' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('threatId') threatId?: string,
    @Query('level') level?: string,
  ): Promise<{ data: ThreatMitigationDto[]; meta: { total: number } }> {
    // Convert string parameters to their proper types
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const levelNumber = level ? parseInt(level, 10) : undefined;
    const isActiveBoolean = isActive === undefined ? undefined : isActive === 'true';
    
    return this.threatMitigationsService.findAll({
      page: pageNumber,
      limit: limitNumber,
      sortBy,
      sortOrder,
      isActive: isActiveBoolean,
      search,
      threatId,
      level: levelNumber,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a threat mitigation by id' })
  @ApiResponse({ status: 200, description: 'Return the threat mitigation.', type: ThreatMitigationDto })
  @ApiResponse({ status: 404, description: 'Threat mitigation not found.' })
  findOne(@Param('id') id: string): Promise<ThreatMitigationDto> {
    return this.threatMitigationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a threat mitigation' })
  @ApiResponse({ status: 200, description: 'The threat mitigation has been successfully updated.', type: ThreatMitigationDto })
  @ApiResponse({ status: 404, description: 'Threat mitigation not found.' })
  update(
    @Param('id') id: string,
    @Body() updateThreatMitigationDto: UpdateThreatMitigationDto,
  ): Promise<ThreatMitigationDto> {
    return this.threatMitigationsService.update(id, updateThreatMitigationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a threat mitigation' })
  @ApiResponse({ status: 200, description: 'The threat mitigation has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Threat mitigation not found.' })
  remove(@Param('id') id: string): Promise<void> {
    return this.threatMitigationsService.remove(id);
  }
} 