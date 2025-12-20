import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';
import {
  RiskOverviewDto,
  DepartmentProfileDto,
  HseCategoryAnalysisDto,
  RiskAnalysisDto,
  ComplianceProgressDto,
} from '../dto/dashboard.dto';
import {
  RiskOverview,
  DepartmentProfile,
  HseCategoryAnalysis,
  RiskAnalysis,
  ComplianceProgress,
} from '../types/dashboard.types';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('risk-overview')
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

  @Get('hse-category-analysis')
  @ApiOperation({ summary: 'Get HSE category analysis' })
  @ApiResponse({
    status: 200,
    description: 'Returns analysis of HSE categories and their risk distributions',
    type: [HseCategoryAnalysisDto],
  })
  async getHseCategoryAnalysis(): Promise<HseCategoryAnalysis[]> {
    return this.dashboardService.getHseCategoryAnalysis();
  }

  @Get('risk-analysis')
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