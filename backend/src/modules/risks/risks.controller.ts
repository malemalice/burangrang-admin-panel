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
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { RisksService } from './risks.service';
import { CreateRiskDto } from './dto/create-risk.dto';
import { UpdateRiskDto } from './dto/update-risk.dto';
import { RiskDto } from './dto/risk.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../shared/decorators/allow-options-bypass.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/types/role.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

interface RequestWithUser extends Request {
  user: { id: string; email: string; role: string };
}

@ApiTags('risks')
@Controller('risks')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class RisksController {
  constructor(private readonly risksService: RisksService) {}

  @Post()
  @Permissions('risk:create')
  @ApiOperation({ summary: 'Create a new risk' })
  @ApiResponse({ status: 201, description: 'The risk has been successfully created.', type: RiskDto })
  create(@Body() createRiskDto: CreateRiskDto): Promise<RiskDto> {
    return this.risksService.create(createRiskDto);
  }

  @Get()
  @AllowOptionsBypass()
  @ApiOperation({ summary: 'Get all risks with pagination' })
  @ApiResponse({ status: 200, description: 'Return all risks.', type: [RiskDto] })
  @ApiQuery({ name: 'riskCategoryId', required: false, description: 'Filter risks by type of hazard ID' })
  @ApiQuery({ name: 'name', required: false, description: 'Filter risks by name (contains)' })
  @ApiQuery({ name: 'code', required: false, description: 'Filter risks by code (contains)' })
  @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('riskCategoryId') riskCategoryId?: string,
    @Query('name') name?: string,
    @Query('code') code?: string,
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
      riskCategoryId,
      name,
      code,
    });
  }

  @Get(':id')
  @Permissions('risk:read')
  @ApiOperation({ summary: 'Get a risk by id' })
  @ApiResponse({ status: 200, description: 'Return the risk.', type: RiskDto })
  @ApiResponse({ status: 404, description: 'Risk not found.' })
  findOne(@Param('id') id: string): Promise<RiskDto> {
    return this.risksService.findOne(id);
  }

  @Patch(':id')
  @Permissions('risk:update')
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
  @Permissions('risk:delete')
  @ApiOperation({ summary: 'Delete a risk' })
  @ApiResponse({ status: 200, description: 'The risk has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Risk not found.' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser): Promise<void> {
    return this.risksService.remove(id, req.user.id);
  }
}
