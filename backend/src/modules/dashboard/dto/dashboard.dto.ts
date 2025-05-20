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

export class HseCategoryAnalysisDto {
  @ApiProperty()
  categoryId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  totalOccurrences: number;

  @ApiProperty({ type: RiskDistributionDto })
  riskDistribution: RiskDistributionDto;
}

export class ThreatAnalysisDto {
  @ApiProperty()
  threatId: string;

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