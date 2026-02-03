import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';
import {
  RiskOverviewDto,
  DepartmentProfileDto,
  RiskCategoryAnalysisDto,
  RiskAnalysisDto,
  ComplianceProgressDto,
} from '../dto/dashboard.dto';
import {
  RiskOverview,
  DepartmentProfile,
  RiskCategoryAnalysis,
  RiskAnalysis,
  ComplianceProgress,
} from '../types/dashboard.types';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard';
import { Permissions } from '../../../shared/decorators/permissions.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('risk-overview')
  @Permissions('risk-assessment:read')
  @ApiOperation({ summary: 'Get risk assessment overview' })
  @ApiResponse({
    status: 200,
    description: 'Returns overview of risk assessments including distribution and recent items',
    type: RiskOverviewDto,
  })
  async getRiskOverview(): Promise<RiskOverview> {
    return this.dashboardService.getRiskOverview();
  }

  @Get('department-profile/:id')
  @Permissions('risk-assessment:read')
  @ApiOperation({ summary: 'Get department risk profile' })
  @ApiParam({ name: 'id', description: 'Department ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns risk profile for a specific department',
    type: DepartmentProfileDto,
  })
  async getDepartmentProfile(@Param('id') departmentId: string): Promise<DepartmentProfile> {
    return this.dashboardService.getDepartmentProfile(departmentId);
  }

  @Get('risk-category-analysis')
  @Permissions('risk-assessment:read')
  @ApiOperation({ summary: 'Get risk category analysis' })
  @ApiResponse({
    status: 200,
    description: 'Returns analysis of risk categories and their risk distributions',
    type: [RiskCategoryAnalysisDto],
  })
  async getRiskCategoryAnalysis(): Promise<RiskCategoryAnalysis[]> {
    return this.dashboardService.getRiskCategoryAnalysis();
  }

  @Get('risk-analysis')
  @Permissions('risk-assessment:read')
  @ApiOperation({ summary: 'Get risk analysis' })
  @ApiResponse({
    status: 200,
    description: 'Returns analysis of risks including frequency and risk ratings',
    type: [RiskAnalysisDto],
  })
  async getRiskAnalysis(): Promise<RiskAnalysis[]> {
    return this.dashboardService.getRiskAnalysis();
  }

  @Get('compliance-progress')
  @Permissions('risk-assessment:read')
  @ApiOperation({ summary: 'Get compliance progress' })
  @ApiResponse({
    status: 200,
    description: 'Returns compliance progress across departments',
    type: ComplianceProgressDto,
  })
  async getComplianceProgress(): Promise<ComplianceProgress> {
    return this.dashboardService.getComplianceProgress();
  }
} 