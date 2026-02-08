import { ApiProperty } from '@nestjs/swagger';
import { RiskRatingEnum } from '@prisma/client';

export class RiskDistributionDto {
  @ApiProperty({ enum: RiskRatingEnum, enumName: 'RiskRatingEnum' })
  LOW: number;

  @ApiProperty({ enum: RiskRatingEnum, enumName: 'RiskRatingEnum' })
  MEDIUM: number;

  @ApiProperty({ enum: RiskRatingEnum, enumName: 'RiskRatingEnum' })
  HIGH: number;

  @ApiProperty({ enum: RiskRatingEnum, enumName: 'RiskRatingEnum' })
  EXTREME: number;
}

export class RecentAssessmentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  department: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  assessmentDate: Date;
}

export class RiskOverviewDto {
  @ApiProperty()
  totalAssessments: number;

  @ApiProperty({ type: RiskDistributionDto })
  riskDistribution: RiskDistributionDto;

  @ApiProperty({ type: [RecentAssessmentDto] })
  recentAssessments: RecentAssessmentDto[];
}

export class DepartmentProfileDto {
  @ApiProperty()
  departmentId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  totalAssessments: number;

  @ApiProperty({ type: RiskDistributionDto })
  riskDistribution: RiskDistributionDto;

  @ApiProperty()
  complianceRate: number;
}

export class RiskCategoryAnalysisDto {
  @ApiProperty()
  categoryId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  totalOccurrences: number;

  @ApiProperty({ type: RiskDistributionDto })
  riskDistribution: RiskDistributionDto;
}

export class RiskAnalysisDto {
  @ApiProperty()
  riskId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  occurrences: number;

  @ApiProperty({ enum: RiskRatingEnum, enumName: 'RiskRatingEnum' })
  averageRiskRating: RiskRatingEnum;
}

export class DepartmentComplianceDto {
  @ApiProperty()
  departmentId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  complianceRate: number;
}

export class ComplianceProgressDto {
  @ApiProperty()
  totalAssessments: number;

  @ApiProperty()
  approvedAssessments: number;

  @ApiProperty()
  pendingAssessments: number;

  @ApiProperty()
  rejectedAssessments: number;

  @ApiProperty()
  complianceRate: number;

  @ApiProperty({ type: [DepartmentComplianceDto] })
  departmentCompliance: DepartmentComplianceDto[];
}

export class IncidentSummaryDto {
  @ApiProperty({ description: 'Category name (e.g. Fatality, Major Accident)' })
  category: string;

  @ApiProperty({ description: 'Actual count of incidents' })
  actual: number;

  @ApiProperty({ description: 'Target value or difference (typically -actual when no target)' })
  target: number;
}

export class IncidentSummaryQueryDto {
  @ApiProperty({ required: false, description: 'Period start YYYY-MM' })
  periodFrom?: string;

  @ApiProperty({ required: false, description: 'Period end YYYY-MM' })
  periodTo?: string;
}

export class HazardStatusDto {
  @ApiProperty({ description: 'Count of open hazard cases' })
  open: number;

  @ApiProperty({ description: 'Count of closed hazard cases' })
  closed: number;

  @ApiProperty({ description: 'Total count (open + closed)' })
  total: number;
}

export class MonthlyHazardMonthDto {
  @ApiProperty({ description: 'Month label (e.g. Jan 2024)' })
  month: string;

  @ApiProperty({ description: 'Count of incidents in that month' })
  count: number;
}

export class MonthlyHazardDto {
  @ApiProperty({ description: 'Category name (e.g. Fatality, Hazard)' })
  category: string;

  @ApiProperty({ type: [MonthlyHazardMonthDto], description: 'Count per month in chronological order' })
  months: { month: string; count: number }[];

  @ApiProperty({ description: 'Total count across all months' })
  total: number;
}

export class HazardTypeDto {
  @ApiProperty({ description: 'Hazard type name (risk category name)' })
  type: string;

  @ApiProperty({ description: 'Count of incidents/inspection items' })
  count: number;
}

export class NonConformanceCriteriaDto {
  @ApiProperty({ description: 'Audit criteria name' })
  criteria: string;

  @ApiProperty({ description: 'Count of non-compliant findings' })
  count: number;
}

export class TopUnsafeConditionDto {
  @ApiProperty({ description: 'Risk/condition name' })
  condition: string;

  @ApiProperty({ description: 'Report count (inspection items)' })
  reportCount: number;
}

export class ResponsibleActionDto {
  @ApiProperty({ description: 'Department/action name' })
  action: string;

  @ApiProperty({ description: 'Count of incidents and inspection items' })
  count: number;
} 