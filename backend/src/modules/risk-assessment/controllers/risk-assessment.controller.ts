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
import { RiskAssessmentService } from '../services/risk-assessment.service';
import { CreateRiskAssessmentDto } from '../dto/create-risk-assessment.dto';
import { UpdateRiskAssessmentDto } from '../dto/update-risk-assessment.dto';
import { RiskAssessmentDto } from '../dto/risk-assessment.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { Role } from '../../../shared/types/role.enum';

@ApiTags('Risk Assessment')
@Controller('risk-assessment')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RiskAssessmentController {
  constructor(private readonly riskAssessmentService: RiskAssessmentService) {}

  @Post()
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
  @ApiOperation({ summary: 'Get all risk assessments with pagination' })
  @ApiResponse({ status: 200, type: [RiskAssessmentDto] })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('isActive') isActive?: boolean,
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
  ) {
    return this.riskAssessmentService.findAll({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      sortBy,
      sortOrder,
      isActive,
      departmentId,
      status,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a risk assessment by id' })
  @ApiResponse({ status: 200, type: RiskAssessmentDto })
  async findOne(@Param('id') id: string): Promise<RiskAssessmentDto> {
    return this.riskAssessmentService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a risk assessment' })
  @ApiResponse({ status: 200, type: RiskAssessmentDto })
  async update(
    @Param('id') id: string,
    @Body() updateRiskAssessmentDto: UpdateRiskAssessmentDto,
  ): Promise<RiskAssessmentDto> {
    return this.riskAssessmentService.update(id, updateRiskAssessmentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a risk assessment' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id') id: string): Promise<void> {
    return this.riskAssessmentService.remove(id);
  }
}
