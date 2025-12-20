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
import { RisksService } from './risks.service';
import { CreateRiskDto } from './dto/create-risk.dto';
import { UpdateRiskDto } from './dto/update-risk.dto';
import { RiskDto } from './dto/risk.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('risks')
@Controller('risks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RisksController {
  constructor(private readonly risksService: RisksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new risk' })
  @ApiResponse({ status: 201, description: 'The risk has been successfully created.', type: RiskDto })
  create(@Body() createRiskDto: CreateRiskDto): Promise<RiskDto> {
    return this.risksService.create(createRiskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all risks with pagination' })
  @ApiResponse({ status: 200, description: 'Return all risks.', type: [RiskDto] })
  @ApiQuery({ name: 'hseCategoryId', required: false, description: 'Filter risks by HSE category ID' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('hseCategoryId') hseCategoryId?: string,
  ): Promise<{ data: RiskDto[]; meta: { total: number } }> {
    // Convert string parameters to their proper types
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const isActiveBoolean = isActive === undefined ? undefined : isActive === 'true';
    
    return this.risksService.findAll({
      page: pageNumber,
      limit: limitNumber,
      sortBy,
      sortOrder,
      isActive: isActiveBoolean,
      search,
      hseCategoryId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a risk by id' })
  @ApiResponse({ status: 200, description: 'Return the risk.', type: RiskDto })
  @ApiResponse({ status: 404, description: 'Risk not found.' })
  findOne(@Param('id') id: string): Promise<RiskDto> {
    return this.risksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a risk' })
  @ApiResponse({ status: 200, description: 'The risk has been successfully updated.', type: RiskDto })
  @ApiResponse({ status: 404, description: 'Risk not found.' })
  update(
    @Param('id') id: string,
    @Body() updateRiskDto: UpdateRiskDto,
  ): Promise<RiskDto> {
    return this.risksService.update(id, updateRiskDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a risk' })
  @ApiResponse({ status: 200, description: 'The risk has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Risk not found.' })
  remove(@Param('id') id: string): Promise<void> {
    return this.risksService.remove(id);
  }
}
