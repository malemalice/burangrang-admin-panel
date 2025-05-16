import { Controller, Get } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('risk-overview')
  getRiskOverview() {
    return this.dashboardService.getRiskOverview();
  }

  @Get('department-profile')
  getDepartmentProfile() {
    return this.dashboardService.getDepartmentProfile();
  }

  @Get('hse-category-analysis')
  getHseCategoryAnalysis() {
    return this.dashboardService.getHseCategoryAnalysis();
  }

  @Get('threat-analysis')
  getThreatAnalysis() {
    return this.dashboardService.getThreatAnalysis();
  }

  @Get('compliance-progress')
  getComplianceProgress() {
    return this.dashboardService.getComplianceProgress();
  }
} 