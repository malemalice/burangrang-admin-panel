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
import { RiskMitigationsService } from './risk-mitigations.service';
import { CreateRiskMitigationDto } from './dto/create-risk-mitigation.dto';
import { UpdateRiskMitigationDto } from './dto/update-risk-mitigation.dto';
import { RiskMitigationDto } from './dto/risk-mitigation.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('risk-mitigations')
@Controller('risk-mitigations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RiskMitigationsController {
  constructor(private readonly riskMitigationsService: RiskMitigationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new risk mitigation' })
  @ApiResponse({ status: 201, description: 'The risk mitigation has been successfully created.', type: RiskMitigationDto })
  create(@Body() createRiskMitigationDto: CreateRiskMitigationDto): Promise<RiskMitigationDto> {
    return this.riskMitigationsService.create(createRiskMitigationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all risk mitigations with pagination' })
  @ApiResponse({ status: 200, description: 'Return all risk mitigations.', type: [RiskMitigationDto] })
  @ApiQuery({ name: 'riskId', required: false, description: 'Filter mitigations by risk ID' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('riskId') riskId?: string,
  ): Promise<{ data: RiskMitigationDto[]; meta: { total: number } }> {
    // Convert string parameters to their proper types
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const isActiveBoolean = isActive === undefined ? undefined : isActive === 'true';
    
    return this.riskMitigationsService.findAll({
      page: pageNumber,
      limit: limitNumber,
      sortBy,
      sortOrder,
      isActive: isActiveBoolean,
      riskId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a risk mitigation by id' })
  @ApiResponse({ status: 200, description: 'Return the risk mitigation.', type: RiskMitigationDto })
  @ApiResponse({ status: 404, description: 'Risk mitigation not found.' })
  findOne(@Param('id') id: string): Promise<RiskMitigationDto> {
    return this.riskMitigationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a risk mitigation' })
  @ApiResponse({ status: 200, description: 'The risk mitigation has been successfully updated.', type: RiskMitigationDto })
  @ApiResponse({ status: 404, description: 'Risk mitigation not found.' })
  update(
    @Param('id') id: string,
    @Body() updateRiskMitigationDto: UpdateRiskMitigationDto,
  ): Promise<RiskMitigationDto> {
    return this.riskMitigationsService.update(id, updateRiskMitigationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a risk mitigation' })
  @ApiResponse({ status: 200, description: 'The risk mitigation has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Risk mitigation not found.' })
  remove(@Param('id') id: string): Promise<void> {
    return this.riskMitigationsService.remove(id);
  }
}
