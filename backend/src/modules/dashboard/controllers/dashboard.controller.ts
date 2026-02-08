import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';
import {
  RiskOverviewDto,
  DepartmentProfileDto,
  RiskCategoryAnalysisDto,
  RiskAnalysisDto,
  ComplianceProgressDto,
  IncidentSummaryDto,
  HazardStatusDto,
  MonthlyHazardDto,
  HazardTypeDto,
  NonConformanceCriteriaDto,
  TopUnsafeConditionDto,
  ResponsibleActionDto,
  IncidentProfileDto,
  SecurityTypeNonConformanceDto,
  SecurityPartiesInvolvedDto,
  SecurityIncidentSummaryDto,
} from '../dto/dashboard.dto';
import {
  RiskOverview,
  DepartmentProfile,
  RiskCategoryAnalysis,
  RiskAnalysis,
  ComplianceProgress,
  IncidentSummaryData,
  HazardStatusData,
  MonthlyHazardData,
  HazardTypeData,
  NonConformanceCriteriaData,
  TopUnsafeConditionData,
  ResponsibleActionData,
  IncidentProfileData,
  SecurityTypeNonConformanceData,
  SecurityPartiesInvolvedData,
  SecurityIncidentSummaryData,
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

  @Get('incident-summary')
  @Permissions('incident:list')
  @ApiOperation({ summary: 'Get incident summary for hazard analytics' })
  @ApiQuery({ name: 'periodFrom', required: false, description: 'Period start YYYY-MM' })
  @ApiQuery({ name: 'periodTo', required: false, description: 'Period end YYYY-MM' })
  @ApiResponse({
    status: 200,
    description: 'Returns incident counts by category (Fatality, Major Accident, etc.)',
    type: [IncidentSummaryDto],
  })
  async getIncidentSummary(
    @Query('periodFrom') periodFrom?: string,
    @Query('periodTo') periodTo?: string,
  ): Promise<IncidentSummaryData[]> {
    return this.dashboardService.getIncidentSummary(periodFrom, periodTo);
  }

  @Get('hazard-case-status')
  @Permissions('incident:list')
  @ApiOperation({ summary: 'Get hazard case status (open vs closed) for hazard analytics' })
  @ApiQuery({ name: 'periodFrom', required: false, description: 'Period start YYYY-MM' })
  @ApiQuery({ name: 'periodTo', required: false, description: 'Period end YYYY-MM' })
  @ApiResponse({
    status: 200,
    description: 'Returns open and closed counts from incidents and inspection items',
    type: HazardStatusDto,
  })
  async getHazardCaseStatus(
    @Query('periodFrom') periodFrom?: string,
    @Query('periodTo') periodTo?: string,
  ): Promise<HazardStatusData> {
    return this.dashboardService.getHazardCaseStatus(periodFrom, periodTo);
  }

  @Get('monthly-hazards')
  @Permissions('incident:list')
  @ApiOperation({ summary: 'Get numbers of hazard per month for hazard analytics' })
  @ApiQuery({ name: 'periodFrom', required: false, description: 'Period start YYYY-MM' })
  @ApiQuery({ name: 'periodTo', required: false, description: 'Period end YYYY-MM' })
  @ApiResponse({
    status: 200,
    description: 'Returns incident counts by category and month',
    type: [MonthlyHazardDto],
  })
  async getMonthlyHazards(
    @Query('periodFrom') periodFrom?: string,
    @Query('periodTo') periodTo?: string,
  ): Promise<MonthlyHazardData[]> {
    return this.dashboardService.getMonthlyHazards(periodFrom, periodTo);
  }

  @Get('hazard-types')
  @Permissions('incident:list')
  @ApiOperation({ summary: 'Get type of hazard counts for hazard analytics' })
  @ApiQuery({ name: 'periodFrom', required: false, description: 'Period start YYYY-MM' })
  @ApiQuery({ name: 'periodTo', required: false, description: 'Period end YYYY-MM' })
  @ApiResponse({
    status: 200,
    description: 'Returns incident and inspection item counts by risk category',
    type: [HazardTypeDto],
  })
  async getHazardTypes(
    @Query('periodFrom') periodFrom?: string,
    @Query('periodTo') periodTo?: string,
  ): Promise<HazardTypeData[]> {
    return this.dashboardService.getHazardTypes(periodFrom, periodTo);
  }

  @Get('non-conformance-criteria')
  @Permissions('incident:list')
  @ApiOperation({ summary: 'Get non-conformance criteria counts for hazard analytics' })
  @ApiQuery({ name: 'periodFrom', required: false, description: 'Period start YYYY-MM' })
  @ApiQuery({ name: 'periodTo', required: false, description: 'Period end YYYY-MM' })
  @ApiResponse({
    status: 200,
    description: 'Returns non-compliant audit item counts by criteria',
    type: [NonConformanceCriteriaDto],
  })
  async getNonConformanceCriteria(
    @Query('periodFrom') periodFrom?: string,
    @Query('periodTo') periodTo?: string,
  ): Promise<NonConformanceCriteriaData[]> {
    return this.dashboardService.getNonConformanceCriteria(periodFrom, periodTo);
  }

  @Get('top-unsafe-conditions')
  @Permissions('incident:list')
  @ApiOperation({ summary: 'Get top 10 unsafe conditions for hazard analytics' })
  @ApiQuery({ name: 'periodFrom', required: false, description: 'Period start YYYY-MM' })
  @ApiQuery({ name: 'periodTo', required: false, description: 'Period end YYYY-MM' })
  @ApiResponse({
    status: 200,
    description: 'Returns top 10 risks by inspection item count',
    type: [TopUnsafeConditionDto],
  })
  async getTopUnsafeConditions(
    @Query('periodFrom') periodFrom?: string,
    @Query('periodTo') periodTo?: string,
  ): Promise<TopUnsafeConditionData[]> {
    return this.dashboardService.getTopUnsafeConditions(periodFrom, periodTo);
  }

  @Get('responsible-actions')
  @Permissions('incident:list')
  @ApiOperation({ summary: 'Get responsible action counts for hazard analytics summary' })
  @ApiQuery({ name: 'periodFrom', required: false, description: 'Period start YYYY-MM' })
  @ApiQuery({ name: 'periodTo', required: false, description: 'Period end YYYY-MM' })
  @ApiResponse({
    status: 200,
    description: 'Returns incident and inspection item counts by assigned department',
    type: [ResponsibleActionDto],
  })
  async getResponsibleActions(
    @Query('periodFrom') periodFrom?: string,
    @Query('periodTo') periodTo?: string,
  ): Promise<ResponsibleActionData[]> {
    return this.dashboardService.getResponsibleActions(periodFrom, periodTo);
  }

  @Get('incident-profile')
  @Permissions('incident:list')
  @ApiOperation({ summary: 'Get incident profile for minor incident analytics' })
  @ApiQuery({
    name: 'fiscalYears',
    required: false,
    description: 'Fiscal years to compare (e.g. year2022_2023,year2023_2024,year2024_2025). Omit for all.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns minor incident counts and percentages by category and fiscal year',
    type: IncidentProfileDto,
  })
  async getIncidentProfile(
    @Query('fiscalYears') fiscalYears?: string | string[],
  ): Promise<IncidentProfileData> {
    return this.dashboardService.getIncidentProfile(fiscalYears);
  }

  @Get('security-incident-summary')
  @Permissions('incident:list')
  @ApiOperation({ summary: 'Get incident summary with YoY difference for security team dashboard' })
  @ApiQuery({ name: 'periodFrom', required: false, description: 'Period start YYYY-MM' })
  @ApiQuery({ name: 'periodTo', required: false, description: 'Period end YYYY-MM' })
  @ApiResponse({
    status: 200,
    description: 'Returns Major, Moderate, Minor, Total incident counts and YoY difference',
    type: [SecurityIncidentSummaryDto],
  })
  async getSecurityIncidentSummary(
    @Query('periodFrom') periodFrom?: string,
    @Query('periodTo') periodTo?: string,
  ): Promise<SecurityIncidentSummaryData[]> {
    return this.dashboardService.getSecurityIncidentSummary(periodFrom, periodTo);
  }

  @Get('security-case-status')
  @Permissions('incident:list')
  @ApiOperation({ summary: 'Get case status (open vs closed) for security team dashboard' })
  @ApiQuery({ name: 'periodFrom', required: false, description: 'Period start YYYY-MM' })
  @ApiQuery({ name: 'periodTo', required: false, description: 'Period end YYYY-MM' })
  @ApiResponse({
    status: 200,
    description: 'Returns open and closed incident counts',
    type: HazardStatusDto,
  })
  async getSecurityCaseStatus(
    @Query('periodFrom') periodFrom?: string,
    @Query('periodTo') periodTo?: string,
  ): Promise<HazardStatusData> {
    return this.dashboardService.getSecurityCaseStatus(periodFrom, periodTo);
  }

  @Get('security-type-non-conformance')
  @Permissions('incident:list')
  @ApiOperation({ summary: 'Get type non-conformance counts for security team dashboard' })
  @ApiQuery({ name: 'periodFrom', required: false, description: 'Period start YYYY-MM' })
  @ApiQuery({ name: 'periodTo', required: false, description: 'Period end YYYY-MM' })
  @ApiResponse({
    status: 200,
    description: 'Returns incident counts by risk category (type)',
    type: [SecurityTypeNonConformanceDto],
  })
  async getSecurityTypeNonConformance(
    @Query('periodFrom') periodFrom?: string,
    @Query('periodTo') periodTo?: string,
  ): Promise<SecurityTypeNonConformanceData[]> {
    return this.dashboardService.getSecurityTypeNonConformance(periodFrom, periodTo);
  }

  @Get('security-parties-involved')
  @Permissions('incident:list')
  @ApiOperation({ summary: 'Get parties involved counts for security team dashboard' })
  @ApiQuery({ name: 'periodFrom', required: false, description: 'Period start YYYY-MM' })
  @ApiQuery({ name: 'periodTo', required: false, description: 'Period end YYYY-MM' })
  @ApiResponse({
    status: 200,
    description: 'Returns incident counts by party (from injured persons and witnesses)',
    type: [SecurityPartiesInvolvedDto],
  })
  async getSecurityPartiesInvolved(
    @Query('periodFrom') periodFrom?: string,
    @Query('periodTo') periodTo?: string,
  ): Promise<SecurityPartiesInvolvedData[]> {
    return this.dashboardService.getSecurityPartiesInvolved(periodFrom, periodTo);
  }
} 