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
import { RiskCategoriesService } from './risk-categories.service';
import { CreateRiskCategoryDto } from './dto/create-risk-category.dto';
import { UpdateRiskCategoryDto } from './dto/update-risk-category.dto';
import { RiskCategoryDto } from './dto/risk-category.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/types/role.enum';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('risk-categories')
@Controller('risk-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RiskCategoriesController {
  constructor(private readonly riskCategoriesService: RiskCategoriesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Create a new risk category' })
  @ApiResponse({ status: 201, description: 'The risk category has been successfully created.', type: RiskCategoryDto })
  create(@Body() createRiskCategoryDto: CreateRiskCategoryDto): Promise<RiskCategoryDto> {
    return this.riskCategoriesService.create(createRiskCategoryDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Get all risk categories with pagination' })
  @ApiResponse({ status: 200, description: 'Return all risk categories.', type: [RiskCategoryDto] })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('name') name?: string,
    @Query('code') code?: string,
  ): Promise<{ data: RiskCategoryDto[]; meta: { total: number } }> {
    // Convert string parameters to their proper types
    const pageNumber = page ? parseInt(page, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    const isActiveBoolean = isActive === undefined ? undefined : isActive === 'true';
    
    return this.riskCategoriesService.findAll({
      page: pageNumber,
      limit: limitNumber,
      sortBy,
      sortOrder,
      isActive: isActiveBoolean,
      search,
      name,
      code,
    });
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Get a risk category by id' })
  @ApiResponse({ status: 200, description: 'Return the risk category.', type: RiskCategoryDto })
  @ApiResponse({ status: 404, description: 'Risk category not found.' })
  findOne(@Param('id') id: string): Promise<RiskCategoryDto> {
    return this.riskCategoriesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Update a risk category' })
  @ApiResponse({ status: 200, description: 'The risk category has been successfully updated.', type: RiskCategoryDto })
  @ApiResponse({ status: 404, description: 'Risk category not found.' })
  update(
    @Param('id') id: string,
    @Body() updateRiskCategoryDto: UpdateRiskCategoryDto,
  ): Promise<RiskCategoryDto> {
    return this.riskCategoriesService.update(id, updateRiskCategoryDto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a risk category' })
  @ApiResponse({ status: 200, description: 'The risk category has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Risk category not found.' })
  remove(@Param('id') id: string): Promise<void> {
    return this.riskCategoriesService.remove(id);
  }
} 