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
import { HseCategoriesService } from './hse-categories.service';
import { CreateHseCategoryDto } from './dto/create-hse-category.dto';
import { UpdateHseCategoryDto } from './dto/update-hse-category.dto';
import { HseCategoryDto } from './dto/hse-category.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('hse-categories')
@Controller('hse-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HseCategoriesController {
  constructor(private readonly hseCategoriesService: HseCategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new HSE category' })
  @ApiResponse({ status: 201, description: 'The HSE category has been successfully created.', type: HseCategoryDto })
  create(@Body() createHseCategoryDto: CreateHseCategoryDto): Promise<HseCategoryDto> {
    return this.hseCategoriesService.create(createHseCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all HSE categories with pagination' })
  @ApiResponse({ status: 200, description: 'Return all HSE categories.', type: [HseCategoryDto] })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ): Promise<{ data: HseCategoryDto[]; meta: { total: number } }> {
    // Convert string parameters to their proper types
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const isActiveBoolean = isActive === undefined ? undefined : isActive === 'true';
    
    return this.hseCategoriesService.findAll({
      page: pageNumber,
      limit: limitNumber,
      sortBy,
      sortOrder,
      isActive: isActiveBoolean,
      search,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a HSE category by id' })
  @ApiResponse({ status: 200, description: 'Return the HSE category.', type: HseCategoryDto })
  @ApiResponse({ status: 404, description: 'HSE category not found.' })
  findOne(@Param('id') id: string): Promise<HseCategoryDto> {
    return this.hseCategoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a HSE category' })
  @ApiResponse({ status: 200, description: 'The HSE category has been successfully updated.', type: HseCategoryDto })
  @ApiResponse({ status: 404, description: 'HSE category not found.' })
  update(
    @Param('id') id: string,
    @Body() updateHseCategoryDto: UpdateHseCategoryDto,
  ): Promise<HseCategoryDto> {
    return this.hseCategoriesService.update(id, updateHseCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a HSE category' })
  @ApiResponse({ status: 200, description: 'The HSE category has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'HSE category not found.' })
  remove(@Param('id') id: string): Promise<void> {
    return this.hseCategoriesService.remove(id);
  }
} 