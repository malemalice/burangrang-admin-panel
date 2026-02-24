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

export interface SecuritySifrComparisonData {
  year: string;
  totalSifr: number;
  majorRate: number;
  moderateRate: number;
  minorRate: number;
}

export interface SecurityMonthlyIncidentRowData {
  category: string;
  months: { month: string; count: number }[];
  total: number;
}

export type SecurityMonthlyIncidentsData = SecurityMonthlyIncidentRowData[];

/** Category plus one number per fiscal year key (e.g. year2020_2021, year2021_2022, ...). */
export interface IncidentCategoryData {
  category: string;
  [fyKey: string]: string | number;
}

export interface IncidentProfileData {
  countData: IncidentCategoryData[];
  percentageData: IncidentCategoryData[];
  yearsToShow: string[];
}

export interface AdminOverviewData {
  lms: {
    overdueEnrollments: number;
    totalEnrollments: number;
    courseCompletionRate: number;
    quizPassRate: number;
  };
  certificates: {
    expiringIn30Days: number;
    totalActive: number;
    renewalBacklog: number;
    categoriesCount: number;
  };
  ppe: {
    lowStockItems: number;
    expiringItems: number;
    withdrawalsPending: number;
    topEquipmentByWithdrawal: string;
  };
  workPermits: {
    pendingApproval: number;
    totalActive: number;
    activePermits: number;
    rejectionRate: number;
  };
  environmental: {
    roomsNotMeasured: number;
    totalRooms: number;
    coveragePercent: number;
    avgReadingsRecorded: number;
  };
  wasteManagement: {
    reportsPendingReview: number;
    totalReports: number;
    missingReports: number;
    totalWasteWeightKg: number;
  };
  manHours: {
    totalManHours: number;
    currentPeriod: string;
    studentManHours: number;
    nonStudentManHours: number;
    yoyChangePercent: number;
  };
} 