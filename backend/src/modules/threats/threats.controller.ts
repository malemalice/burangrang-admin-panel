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
import { ThreatsService } from './threats.service';
import { CreateThreatDto } from './dto/create-threat.dto';
import { UpdateThreatDto } from './dto/update-threat.dto';
import { ThreatDto } from './dto/threat.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('threats')
@Controller('threats')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ThreatsController {
  constructor(private readonly threatsService: ThreatsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new threat' })
  @ApiResponse({ status: 201, description: 'The threat has been successfully created.', type: ThreatDto })
  create(@Body() createThreatDto: CreateThreatDto): Promise<ThreatDto> {
    return this.threatsService.create(createThreatDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all threats with pagination' })
  @ApiResponse({ status: 200, description: 'Return all threats.', type: [ThreatDto] })
  @ApiQuery({ name: 'hseCategoryId', required: false, description: 'Filter threats by HSE category ID' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('hseCategoryId') hseCategoryId?: string,
  ): Promise<{ data: ThreatDto[]; meta: { total: number } }> {
    // Convert string parameters to their proper types
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const isActiveBoolean = isActive === undefined ? undefined : isActive === 'true';
    
    return this.threatsService.findAll({
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
  @ApiOperation({ summary: 'Get a threat by id' })
  @ApiResponse({ status: 200, description: 'Return the threat.', type: ThreatDto })
  @ApiResponse({ status: 404, description: 'Threat not found.' })
  findOne(@Param('id') id: string): Promise<ThreatDto> {
    return this.threatsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a threat' })
  @ApiResponse({ status: 200, description: 'The threat has been successfully updated.', type: ThreatDto })
  @ApiResponse({ status: 404, description: 'Threat not found.' })
  update(
    @Param('id') id: string,
    @Body() updateThreatDto: UpdateThreatDto,
  ): Promise<ThreatDto> {
    return this.threatsService.update(id, updateThreatDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a threat' })
  @ApiResponse({ status: 200, description: 'The threat has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Threat not found.' })
  remove(@Param('id') id: string): Promise<void> {
    return this.threatsService.remove(id);
  }
} 