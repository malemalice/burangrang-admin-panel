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

export interface IncidentSummaryData {
  category: string;
  actual: number;
  target: number;
}

export interface HazardStatusData {
  open: number;
  closed: number;
  total: number;
}

export interface MonthlyHazardData {
  category: string;
  months: { month: string; count: number }[];
  total: number;
}

export interface HazardTypeData {
  type: string;
  count: number;
}

export interface NonConformanceCriteriaData {
  criteria: string;
  count: number;
}

export interface TopUnsafeConditionData {
  condition: string;
  reportCount: number;
}

export interface ResponsibleActionData {
  action: string;
  count: number;
}

export interface SecurityTypeNonConformanceData {
  type: string;
  count: number;
}

export interface SecurityPartiesInvolvedData {
  party: string;
  count: number;
}

export interface SecurityIncidentSummaryData {
  category: string;
  count: number;
  difference: number;
}

export interface IncidentCategoryData {
  category: string;
  year2022_2023: number;
  year2023_2024: number;
  year2024_2025: number;
}

export interface IncidentProfileData {
  countData: IncidentCategoryData[];
  percentageData: IncidentCategoryData[];
  yearsToShow: string[];
} 