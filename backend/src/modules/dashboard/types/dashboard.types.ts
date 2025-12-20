import { RiskRatingEnum } from '@prisma/client';

export interface RiskOverview {
  totalAssessments: number;
  riskDistribution: {
    [key in RiskRatingEnum]: number;
  };
  recentAssessments: Array<{
    id: string;
    code: string;
    department: string;
    status: string;
    assessmentDate: Date;
  }>;
}

export interface DepartmentProfile {
  departmentId: string;
  name: string;
  totalAssessments: number;
  riskDistribution: {
    [key in RiskRatingEnum]: number;
  };
  complianceRate: number;
}

export interface RiskCategoryAnalysis {
  categoryId: string;
  name: string;
  totalOccurrences: number;
  riskDistribution: {
    [key in RiskRatingEnum]: number;
  };
}

export interface RiskAnalysis {
  riskId: string;
  name: string;
  category: string;
  occurrences: number;
  averageRiskRating: RiskRatingEnum;
}

export interface ComplianceProgress {
  totalAssessments: number;
  approvedAssessments: number;
  pendingAssessments: number;
  rejectedAssessments: number;
  complianceRate: number;
  departmentCompliance: Array<{
    departmentId: string;
    name: string;
    complianceRate: number;
  }>;
} 