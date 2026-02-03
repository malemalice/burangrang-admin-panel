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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GeneralStatusEnum } from '@prisma/client';
import { RiskAssessmentService } from '../services/risk-assessment.service';
import { CreateRiskAssessmentDto } from '../dto/create-risk-assessment.dto';
import { UpdateRiskAssessmentDto } from '../dto/update-risk-assessment.dto';
import { RiskAssessmentDto } from '../dto/risk-assessment.dto';
import { CreateRiskAssessmentItemDto } from '../dto/create-risk-assessment-item.dto';
import { UpdateRiskAssessmentItemDto } from '../dto/update-risk-assessment-item.dto';
import { RiskAssessmentItemDto } from '../dto/risk-assessment-item.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import { Permissions } from '../../../shared/decorators/permissions.decorator';

@ApiTags('Risk Assessment')
@Controller('risk-assessment')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class RiskAssessmentController {
  constructor(private readonly riskAssessmentService: RiskAssessmentService) {}

  @Post()
  @Permissions('risk-assessment:create')
  @ApiOperation({ summary: 'Create a new risk assessment' })
  @ApiResponse({ status: 201, type: RiskAssessmentDto })
  async create(
    @Request() req,
    @Body() createRiskAssessmentDto: CreateRiskAssessmentDto,
  ): Promise<RiskAssessmentDto> {
    return this.riskAssessmentService.create(
      createRiskAssessmentDto,
      req.user.id,
    );
  }

  @Get()
  @Permissions('risk-assessment:list')
  @ApiOperation({ summary: 'Get all risk assessments with pagination' })
  @ApiResponse({ status: 200, type: [RiskAssessmentDto] })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: boolean,
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: GeneralStatusEnum,
    @Query('search') search?: string,
  ) {
    return this.riskAssessmentService.findAll({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      sortBy,
      sortOrder,
      isActive,
      departmentId,
      status,
      search,
    });
  }

  @Get(':id')
  @Permissions('risk-assessment:read')
  @ApiOperation({ summary: 'Get a risk assessment by id' })
  @ApiResponse({ status: 200, type: RiskAssessmentDto })
  async findOne(@Param('id') id: string): Promise<RiskAssessmentDto> {
    return this.riskAssessmentService.findOne(id);
  }

  @Patch(':id')
  @Permissions('risk-assessment:update')
  @ApiOperation({ summary: 'Update a risk assessment' })
  @ApiResponse({ status: 200, type: RiskAssessmentDto })
  async update(
    @Param('id') id: string,
    @Body() updateRiskAssessmentDto: UpdateRiskAssessmentDto,
  ): Promise<RiskAssessmentDto> {
    return this.riskAssessmentService.update(id, updateRiskAssessmentDto);
  }

  @Delete(':id')
  @Permissions('risk-assessment:delete')
  @ApiOperation({ summary: 'Delete a risk assessment' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id') id: string): Promise<void> {
    return this.riskAssessmentService.remove(id);
  }

  // Risk Assessment Items endpoints
  @Post(':id/items')
  @Permissions('risk-assessment:create')
  @ApiOperation({ summary: 'Create a new risk assessment item' })
  @ApiResponse({ status: 201, type: RiskAssessmentItemDto })
  async createItem(
    @Param('id') id: string,
    @Body() createItemDto: CreateRiskAssessmentItemDto,
  ): Promise<RiskAssessmentItemDto> {
    return this.riskAssessmentService.createItem(id, createItemDto);
  }

  @Get(':id/items')
  @Permissions('risk-assessment:read')
  @ApiOperation({ summary: 'Get all risk assessment items with pagination' })
  @ApiResponse({ status: 200, type: [RiskAssessmentItemDto] })
  async findAllItems(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('search') search?: string,
  ) {
    return this.riskAssessmentService.findAllItems(id, {
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      sortBy,
      sortOrder,
      search,
    });
  }

  @Get(':id/items/:itemId')
  @Permissions('risk-assessment:read')
  @ApiOperation({ summary: 'Get a risk assessment item by id' })
  @ApiResponse({ status: 200, type: RiskAssessmentItemDto })
  async findOneItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ): Promise<RiskAssessmentItemDto> {
    return this.riskAssessmentService.findOneItem(id, itemId);
  }

  @Patch(':id/items/:itemId')
  @Permissions('risk-assessment:update')
  @ApiOperation({ summary: 'Update a risk assessment item' })
  @ApiResponse({ status: 200, type: RiskAssessmentItemDto })
  async updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() updateItemDto: UpdateRiskAssessmentItemDto,
  ): Promise<RiskAssessmentItemDto> {
    return this.riskAssessmentService.updateItem(id, itemId, updateItemDto);
  }

  @Delete(':id/items/:itemId')
  @Permissions('risk-assessment:delete')
  @ApiOperation({ summary: 'Delete a risk assessment item' })
  @ApiResponse({ status: 204 })
  async removeItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ): Promise<void> {
    return this.riskAssessmentService.removeItem(id, itemId);
  }
}
