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

export class SecurityTypeNonConformanceDto {
  @ApiProperty({ description: 'Risk category / type name' })
  type: string;

  @ApiProperty({ description: 'Count of incidents' })
  count: number;
}

export class SecurityPartiesInvolvedDto {
  @ApiProperty({ description: 'Party label (e.g. Staff, Students)' })
  party: string;

  @ApiProperty({ description: 'Count of occurrences' })
  count: number;
}

export class SecurityIncidentSummaryDto {
  @ApiProperty({ description: 'Category (e.g. Major Incident, Total Incident)' })
  category: string;

  @ApiProperty({ description: 'Count in current period' })
  count: number;

  @ApiProperty({ description: 'Year-over-year difference (current - previous period)' })
  difference: number;
}

export class SecuritySifrComparisonDto {
  @ApiProperty({ description: 'Academic year (e.g. 2023-2024)' })
  year: string;

  @ApiProperty({ description: 'Total SIFR (incidents per 1M man-hours)' })
  totalSifr: number;

  @ApiProperty({ description: 'Major incident rate' })
  majorRate: number;

  @ApiProperty({ description: 'Moderate incident rate' })
  moderateRate: number;

  @ApiProperty({ description: 'Minor incident rate' })
  minorRate: number;
}

export class SecurityMonthlyIncidentMonthDto {
  @ApiProperty({ description: 'Month label (e.g. Aug 2024)' })
  month: string;

  @ApiProperty({ description: 'Incident count for this month' })
  count: number;
}

export class SecurityMonthlyIncidentRowDto {
  @ApiProperty({ description: 'Category (Minor, Moderate, Major, Total Incident)' })
  category: string;

  @ApiProperty({ type: [SecurityMonthlyIncidentMonthDto], description: 'Count per month in period order' })
  months: { month: string; count: number }[];

  @ApiProperty({ description: 'Total count for this category in the period' })
  total: number;
}

export class IncidentCategoryDataDto {
  @ApiProperty({ description: 'Incident category (mechanism of injury label)' })
  category: string;

  /** Dynamic fiscal year keys (year2020_2021, year2021_2022, ... through current FY) with count or percentage. */
  [fyKey: string]: string | number;
}

export class IncidentProfileDto {
  @ApiProperty({ type: [IncidentCategoryDataDto], description: 'Count by category per fiscal year' })
  countData: IncidentCategoryDataDto[];

  @ApiProperty({ type: [IncidentCategoryDataDto], description: 'Percentage by category per fiscal year' })
  percentageData: IncidentCategoryDataDto[];

  @ApiProperty({ type: [String], description: 'Fiscal year keys to display' })
  yearsToShow: string[];
}

export class AdminOverviewLmsDto {
  @ApiProperty({ description: 'Enrollments past due date not completed' })
  overdueEnrollments: number;

  @ApiProperty({ description: 'Total enrollments' })
  totalEnrollments: number;

  @ApiProperty({ description: 'Course completion rate percentage' })
  courseCompletionRate: number;

  @ApiProperty({ description: 'Quiz pass rate percentage' })
  quizPassRate: number;
}

export class AdminOverviewCertificatesDto {
  @ApiProperty({ description: 'Certificates expiring within 30 days' })
  expiringIn30Days: number;

  @ApiProperty({ description: 'Total active certificates' })
  totalActive: number;

  @ApiProperty({ description: 'Renewals pending, requested, or in progress' })
  renewalBacklog: number;

  @ApiProperty({ description: 'Distinct certificate categories in use' })
  categoriesCount: number;
}

export class AdminOverviewPpeDto {
  @ApiProperty({ description: 'Low stock items count' })
  lowStockItems: number;

  @ApiProperty({ description: 'Expiring items count' })
  expiringItems: number;

  @ApiProperty({ description: 'Withdrawals pending approval' })
  withdrawalsPending: number;

  @ApiProperty({ description: 'Top equipment by withdrawal (e.g. Safety Helmets: 45)' })
  topEquipmentByWithdrawal: string;
}

export class AdminOverviewWorkPermitsDto {
  @ApiProperty({ description: 'Permits pending approval' })
  pendingApproval: number;

  @ApiProperty({ description: 'Total active permits' })
  totalActive: number;

  @ApiProperty({ description: 'Active permits count' })
  activePermits: number;

  @ApiProperty({ description: 'Rejection rate percentage' })
  rejectionRate: number;
}

export class AdminOverviewEnvironmentalDto {
  @ApiProperty({ description: 'Rooms not measured in period' })
  roomsNotMeasured: number;

  @ApiProperty({ description: 'Total rooms' })
  totalRooms: number;

  @ApiProperty({ description: 'Coverage percentage' })
  coveragePercent: number;

  @ApiProperty({ description: 'Average readings recorded' })
  avgReadingsRecorded: number;
}

export class AdminOverviewWasteManagementDto {
  @ApiProperty({ description: 'Reports pending review' })
  reportsPendingReview: number;

  @ApiProperty({ description: 'Total reports' })
  totalReports: number;

  @ApiProperty({ description: 'Missing reports' })
  missingReports: number;

  @ApiProperty({ description: 'Total waste weight in kg' })
  totalWasteWeightKg: number;
}

export class AdminOverviewManHoursDto {
  @ApiProperty({ description: 'Total man-hours' })
  totalManHours: number;

  @ApiProperty({ description: 'Current period label (e.g. Jan 2026)' })
  currentPeriod: string;

  @ApiProperty({ description: 'Student man-hours' })
  studentManHours: number;

  @ApiProperty({ description: 'Non-student man-hours' })
  nonStudentManHours: number;

  @ApiProperty({ description: 'Year-over-year change percentage' })
  yoyChangePercent: number;
}

export class AdminOverviewDto {
  @ApiProperty({ type: AdminOverviewLmsDto, description: 'Learning Management metrics' })
  lms: AdminOverviewLmsDto;

  @ApiProperty({ type: AdminOverviewCertificatesDto, description: 'Certificates metrics' })
  certificates: AdminOverviewCertificatesDto;

  @ApiProperty({ type: AdminOverviewPpeDto, description: 'PPE & Equipment metrics (placeholder)' })
  ppe: AdminOverviewPpeDto;

  @ApiProperty({ type: AdminOverviewWorkPermitsDto, description: 'Work Permits metrics (placeholder)' })
  workPermits: AdminOverviewWorkPermitsDto;

  @ApiProperty({ type: AdminOverviewEnvironmentalDto, description: 'Environmental measurements (placeholder)' })
  environmental: AdminOverviewEnvironmentalDto;

  @ApiProperty({ type: AdminOverviewWasteManagementDto, description: 'Waste management metrics (placeholder)' })
  wasteManagement: AdminOverviewWasteManagementDto;

  @ApiProperty({ type: AdminOverviewManHoursDto, description: 'Man hours metrics (placeholder)' })
  manHours: AdminOverviewManHoursDto;
} 