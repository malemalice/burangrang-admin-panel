import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import {
  CertificateRenewalStatusEnum,
  CompliantStatusEnum,
  EnrollmentStatusEnum,
  GeneralStatusEnum,
  HseTargetTypeEnum,
  IncidentClassificationEnum,
  IncidentTypeEnum,
  IncidentScopeEnum,
  LevelOfInjuryEnum,
  MechanismOfInjuryEnum,
  MonthEnum,
  PPEStockStatusEnum,
  PPEWithdrawalStatusEnum,
  ReportStatusEnum,
  RiskRatingEnum,
  WaterQualityLabReportStatusEnum,
  WeightReportStatusEnum,
} from '@prisma/client';
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
  IncidentCategoryData,
  SecurityTypeNonConformanceData,
  SecurityPartiesInvolvedData,
  SecurityIncidentSummaryData,
  SecuritySifrComparisonData,
  SecurityMonthlyIncidentsData,
  AdminOverviewData,
} from '../types/dashboard.types';
import { isNotDeleted } from '../../../shared/utils/soft-delete.util';

@Injectable()
export class DashboardService {
  private adminOverviewCache:
    | { expiresAtMs: number; value: AdminOverviewData }
    | undefined;

  constructor(private prisma: PrismaService) {}

  async getRiskOverview(): Promise<RiskOverview> {
    const [totalAssessments, riskItems, recentAssessments] = await Promise.all([
      // Get total assessments
      this.prisma.riskAssessment.count({
        where: { isActive: true, ...isNotDeleted },
      }),
      // Get risk distribution
      this.prisma.riskAssessmentItem.groupBy({
        by: ['riskMatrixRating'],
        _count: true,
        where: {
          ...isNotDeleted,
          riskAssessment: { is: { isActive: true, ...isNotDeleted } },
        },
      }),
      // Get recent assessments
      this.prisma.riskAssessment.findMany({
        where: { isActive: true, ...isNotDeleted },
        take: 5,
        orderBy: { assessmentDate: 'desc' },
        include: {
          department: {
            select: { name: true },
          },
        },
      }),
    ]);

    const riskDistribution = Object.values(RiskRatingEnum).reduce(
      (acc, rating) => ({
        ...acc,
        [rating]: riskItems.find((item) => item.riskMatrixRating === rating)?._count ?? 0,
      }),
      {} as { [key in RiskRatingEnum]: number },
    );

    return {
      totalAssessments,
      riskDistribution,
      recentAssessments: recentAssessments.map((assessment) => ({
        id: assessment.id,
        code: assessment.code,
        department: assessment.department.name,
        status: assessment.status,
        assessmentDate: assessment.assessmentDate,
      })),
    };
  }

  async getDepartmentProfile(departmentId: string): Promise<DepartmentProfile> {
    const [department, assessments, riskItems] = await Promise.all([
      // Get department
      this.prisma.department.findUnique({
        where: { id: departmentId },
      }),
      // Get department assessments
      this.prisma.riskAssessment.findMany({
        where: { departmentId, isActive: true, ...isNotDeleted },
      }),
      // Get risk distribution
      this.prisma.riskAssessmentItem.findMany({
        where: {
          ...isNotDeleted,
          riskAssessment: {
            is: { departmentId, isActive: true, ...isNotDeleted },
          },
        },
      }),
    ]);

    const riskDistribution = Object.values(RiskRatingEnum).reduce(
      (acc, rating) => ({
        ...acc,
        [rating]: riskItems.filter((item) => item.riskMatrixRating === rating).length,
      }),
      {} as { [key in RiskRatingEnum]: number },
    );

    const approvedAssessments = assessments.filter((a) => a.status === GeneralStatusEnum.DONE).length;

    return {
      departmentId,
      name: department?.name ?? '',
      totalAssessments: assessments.length,
      riskDistribution,
      complianceRate: assessments.length ? (approvedAssessments / assessments.length) * 100 : 0,
    };
  }

  async getRiskCategoryAnalysis(): Promise<RiskCategoryAnalysis[]> {
    const categories = await (this.prisma as any).riskCategory.findMany({
      where: { isActive: true },
      include: {
        riskAssessmentItems: {
          where: {
            ...isNotDeleted,
            riskAssessment: { is: { isActive: true, ...isNotDeleted } },
          },
        },
      },
    });

    return categories.map((category) => {
      const riskDistribution = Object.values(RiskRatingEnum).reduce(
        (acc, rating) => ({
          ...acc,
          [rating]: category.riskAssessmentItems.filter(
            (item) => item.riskMatrixRating === rating,
          ).length,
        }),
        {} as { [key in RiskRatingEnum]: number },
      );

      return {
        categoryId: category.id,
        name: category.name,
        totalOccurrences: category.riskAssessmentItems.length,
        riskDistribution,
      };
    });
  }

  async getRiskAnalysis(): Promise<RiskAnalysis[]> {
    const risks = await (this.prisma as any).risk.findMany({
      where: { isActive: true, ...isNotDeleted },
      include: {
        riskCategory: true,
        riskAssessmentItems: {
          where: {
            ...isNotDeleted,
            riskAssessment: { is: { isActive: true, ...isNotDeleted } },
          },
        },
      },
    });

    return risks.map((risk: any) => {
      const occurrences = risk.riskAssessmentItems.length;
      
      // Calculate average risk rating
      const ratingCounts = Object.values(RiskRatingEnum).reduce(
        (acc, rating) => ({
          ...acc,
          [rating]: risk.riskAssessmentItems.filter(
            (item: any) => item.riskMatrixRating === rating,
          ).length,
        }),
        {} as { [key in RiskRatingEnum]: number },
      );

      // Determine the most frequent risk rating
      const averageRiskRating = Object.entries(ratingCounts).reduce(
        (acc, [rating, count]) => (count > (ratingCounts[acc] ?? 0) ? rating as RiskRatingEnum : acc),
        RiskRatingEnum.LOW,
      );

      return {
        riskId: risk.id,
        name: risk.name,
        category: risk.riskCategory.name,
        occurrences,
        averageRiskRating,
      };
    });
  }

  async getComplianceProgress(): Promise<ComplianceProgress> {
    const [assessments, departments] = await Promise.all([
      // Get all assessments
      this.prisma.riskAssessment.findMany({
        where: { isActive: true, ...isNotDeleted },
        include: {
          department: true,
        },
      }),
      // Get all departments
      this.prisma.department.findMany({
        where: { isActive: true },
      }),
    ]);

    const totalAssessments = assessments.length;
    const approvedAssessments = assessments.filter((a) => a.status === GeneralStatusEnum.DONE).length;
    const pendingAssessments = assessments.filter((a) => a.status === GeneralStatusEnum.WAITING_APPROVAL).length;
    const rejectedAssessments = assessments.filter((a) => a.status === GeneralStatusEnum.REJECTED).length;

    const departmentCompliance = departments.map((dept) => {
      const deptAssessments = assessments.filter((a) => a.departmentId === dept.id);
      const deptApproved = deptAssessments.filter((a) => a.status === GeneralStatusEnum.DONE).length;
      
      return {
        departmentId: dept.id,
        name: dept.name,
        complianceRate: deptAssessments.length
          ? (deptApproved / deptAssessments.length) * 100
          : 0,
      };
    });

    return {
      totalAssessments,
      approvedAssessments,
      pendingAssessments,
      rejectedAssessments,
      complianceRate: totalAssessments ? (approvedAssessments / totalAssessments) * 100 : 0,
      departmentCompliance,
    };
  }

  private static readonly INCIDENT_CATEGORY_TO_CODE: Record<string, string> = {
    'Fatality': 'FATALITY',
    'Major Accident': 'MAJOR',
    'Minor Accident/Recordable Injuries': 'MINOR',
    'Near Miss': 'NEAR_MISS',
    'Hazard': 'HAZARD',
  };

  async getIncidentSummary(
    periodFrom?: string,
    periodTo?: string,
  ): Promise<IncidentSummaryData[]> {
    const where: { isActive: boolean; incidentDate?: { gte?: Date; lte?: Date } } = {
      isActive: true,
    };

    if (periodFrom || periodTo) {
      where.incidentDate = {};
      if (periodFrom) {
        const [y, m] = periodFrom.split('-').map(Number);
        where.incidentDate.gte = new Date(y, m - 1, 1);
      }
      if (periodTo) {
        const [y, m] = periodTo.split('-').map(Number);
        where.incidentDate.lte = new Date(y, m, 0, 23, 59, 59, 999);
      }
    }

    const currentYear = new Date().getFullYear();
    let years: number[];
    if (periodFrom && periodTo) {
      const [yFrom] = periodFrom.split('-').map(Number);
      const [yTo] = periodTo.split('-').map(Number);
      years = [];
      for (let y = yFrom; y <= yTo; y++) years.push(y);
    } else if (periodFrom) {
      years = [periodFrom.split('-').map(Number)[0]];
    } else if (periodTo) {
      years = [periodTo.split('-').map(Number)[0]];
    } else {
      years = [currentYear];
    }

    const [incidents, hseTargets] = await Promise.all([
      this.prisma.incident.findMany({
        where,
        select: {
          incidentType: true,
          incidentClassification: true,
        },
      }),
      this.prisma.hseTarget.findMany({
        where: {
          type: HseTargetTypeEnum.INCIDENT,
          year: { in: years },
          month: null,
          isActive: true,
          ...isNotDeleted,
        },
        select: { code: true, year: true, target: true },
      }),
    ]);

    const targetSumByCode = new Map<string, number>();
    for (const t of hseTargets) {
      const sum = (targetSumByCode.get(t.code) ?? 0) + Number(t.target);
      targetSumByCode.set(t.code, sum);
    }

    const categories: Array<{ label: string; filter: (i: { incidentType: string; incidentClassification: string }) => boolean }> = [
      {
        label: 'Fatality',
        filter: (i) => i.incidentClassification === IncidentClassificationEnum.FATALITY,
      },
      {
        label: 'Major Accident',
        filter: (i) =>
          i.incidentType === IncidentTypeEnum.ACCIDENT &&
          i.incidentClassification === IncidentClassificationEnum.MAJOR,
      },
      {
        label: 'Minor Accident/Recordable Injuries',
        filter: (i) =>
          i.incidentType === IncidentTypeEnum.ACCIDENT &&
          i.incidentClassification === IncidentClassificationEnum.MINOR,
      },
      {
        label: 'Near Miss',
        filter: (i) => i.incidentType === IncidentTypeEnum.NEAR_MISS,
      },
      {
        label: 'Hazard',
        filter: (i) =>
          i.incidentType === IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE,
      },
    ];

    return categories.map(({ label, filter }) => {
      const actual = incidents.filter(filter).length;
      const code = DashboardService.INCIDENT_CATEGORY_TO_CODE[label];
      const hseTargetSum = code ? targetSumByCode.get(code) : undefined;
      const targetValue = hseTargetSum != null ? actual - hseTargetSum : -actual;
      return {
        category: label,
        actual,
        target: targetValue,
      };
    });
  }

  private static readonly OPEN_STATUSES: GeneralStatusEnum[] = [
    GeneralStatusEnum.OPEN,
    GeneralStatusEnum.WAITING_APPROVAL,
    GeneralStatusEnum.SCHEDULED,
    GeneralStatusEnum.DRAFT,
  ];

  private static readonly CLOSED_STATUSES: GeneralStatusEnum[] = [
    GeneralStatusEnum.DONE,
    GeneralStatusEnum.CLOSE,
    GeneralStatusEnum.REJECTED,
  ];

  async getHazardCaseStatus(
    periodFrom?: string,
    periodTo?: string,
  ): Promise<HazardStatusData> {
    const incidentWhere: { isActive: boolean; incidentDate?: { gte?: Date; lte?: Date } } = {
      isActive: true,
    };
    if (periodFrom || periodTo) {
      incidentWhere.incidentDate = {};
      if (periodFrom) {
        const [y, m] = periodFrom.split('-').map(Number);
        incidentWhere.incidentDate.gte = new Date(y, m - 1, 1);
      }
      if (periodTo) {
        const [y, m] = periodTo.split('-').map(Number);
        incidentWhere.incidentDate.lte = new Date(y, m, 0, 23, 59, 59, 999);
      }
    }

    const inspectionWhere: { inspection: { isActive: boolean; inspectionDate?: { gte?: Date; lte?: Date } } } = {
      inspection: { isActive: true },
    };
    if (periodFrom || periodTo) {
      inspectionWhere.inspection.inspectionDate = {};
      if (periodFrom) {
        const [y, m] = periodFrom.split('-').map(Number);
        inspectionWhere.inspection.inspectionDate!.gte = new Date(y, m - 1, 1);
      }
      if (periodTo) {
        const [y, m] = periodTo.split('-').map(Number);
        inspectionWhere.inspection.inspectionDate!.lte = new Date(y, m, 0, 23, 59, 59, 999);
      }
    }

    const [incidents, inspectionItems] = await Promise.all([
      this.prisma.incident.findMany({
        where: incidentWhere,
        select: { status: true },
      }),
      this.prisma.inspectionItem.findMany({
        where: inspectionWhere,
        select: { status: true },
      }),
    ]);

    let open = 0;
    let closed = 0;
    for (const { status } of incidents) {
      if (DashboardService.OPEN_STATUSES.includes(status)) open += 1;
      else if (DashboardService.CLOSED_STATUSES.includes(status)) closed += 1;
    }
    for (const { status } of inspectionItems) {
      if (DashboardService.OPEN_STATUSES.includes(status)) open += 1;
      else if (DashboardService.CLOSED_STATUSES.includes(status)) closed += 1;
    }

    return {
      open,
      closed,
      total: open + closed,
    };
  }

  private static readonly MONTH_ABBREV = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  private static formatMonthLabel(year: number, month: number): string {
    return `${DashboardService.MONTH_ABBREV[month - 1]} ${year}`;
  }

  async getMonthlyHazards(
    periodFrom?: string,
    periodTo?: string,
  ): Promise<MonthlyHazardData[]> {
    const where: { isActive: boolean; incidentDate?: { gte?: Date; lte?: Date } } = {
      isActive: true,
    };
    if (periodFrom || periodTo) {
      where.incidentDate = {};
      if (periodFrom) {
        const [y, m] = periodFrom.split('-').map(Number);
        where.incidentDate.gte = new Date(y, m - 1, 1);
      }
      if (periodTo) {
        const [y, m] = periodTo.split('-').map(Number);
        where.incidentDate.lte = new Date(y, m, 0, 23, 59, 59, 999);
      }
    }

    const incidents = await this.prisma.incident.findMany({
      where,
      select: {
        incidentType: true,
        incidentClassification: true,
        incidentDate: true,
      },
    });

    const categories: Array<{ label: string; filter: (i: { incidentType: string; incidentClassification: string }) => boolean }> = [
      {
        label: 'Fatality',
        filter: (i) => i.incidentClassification === IncidentClassificationEnum.FATALITY,
      },
      {
        label: 'Major Accident',
        filter: (i) =>
          i.incidentType === IncidentTypeEnum.ACCIDENT &&
          i.incidentClassification === IncidentClassificationEnum.MAJOR,
      },
      {
        label: 'Minor Accident/Recordable Injuries',
        filter: (i) =>
          i.incidentType === IncidentTypeEnum.ACCIDENT &&
          i.incidentClassification === IncidentClassificationEnum.MINOR,
      },
      {
        label: 'Near Miss',
        filter: (i) => i.incidentType === IncidentTypeEnum.NEAR_MISS,
      },
      {
        label: 'Hazard',
        filter: (i) =>
          i.incidentType === IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE,
      },
    ];

    type YearMonth = { year: number; month: number };
    let monthList: YearMonth[];

    if (periodFrom && periodTo) {
      const [yFrom, mFrom] = periodFrom.split('-').map(Number);
      const [yTo, mTo] = periodTo.split('-').map(Number);
      monthList = [];
      for (let y = yFrom; y <= yTo; y++) {
        const startM = y === yFrom ? mFrom : 1;
        const endM = y === yTo ? mTo : 12;
        for (let m = startM; m <= endM; m++) {
          monthList.push({ year: y, month: m });
        }
      }
    } else if (periodFrom) {
      const [yFrom, mFrom] = periodFrom.split('-').map(Number);
      const maxDate = incidents.length
        ? incidents.reduce((max, i) => (i.incidentDate > max ? i.incidentDate : max), incidents[0].incidentDate)
        : new Date();
      const yTo = maxDate.getFullYear();
      const mTo = maxDate.getMonth() + 1;
      monthList = [];
      for (let y = yFrom; y <= yTo; y++) {
        const startM = y === yFrom ? mFrom : 1;
        const endM = y === yTo ? mTo : 12;
        for (let m = startM; m <= endM; m++) {
          monthList.push({ year: y, month: m });
        }
      }
    } else if (periodTo) {
      const [yTo, mTo] = periodTo.split('-').map(Number);
      const minDate = incidents.length
        ? incidents.reduce((min, i) => (i.incidentDate < min ? i.incidentDate : min), incidents[0].incidentDate)
        : new Date();
      const yFrom = minDate.getFullYear();
      const mFrom = minDate.getMonth() + 1;
      monthList = [];
      for (let y = yFrom; y <= yTo; y++) {
        const startM = y === yFrom ? mFrom : 1;
        const endM = y === yTo ? mTo : 12;
        for (let m = startM; m <= endM; m++) {
          monthList.push({ year: y, month: m });
        }
      }
    } else {
      const set = new Set<string>();
      for (const i of incidents) {
        const y = i.incidentDate.getFullYear();
        const m = i.incidentDate.getMonth() + 1;
        set.add(`${y}-${m}`);
      }
      const sorted = Array.from(set).sort();
      monthList = sorted.map((key) => {
        const [y, m] = key.split('-').map(Number);
        return { year: y, month: m };
      });
    }

    return categories.map(({ label, filter }) => {
      const filtered = incidents.filter((i) => filter(i));
      const countByMonth = new Map<string, number>();
      for (const i of filtered) {
        const y = i.incidentDate.getFullYear();
        const m = i.incidentDate.getMonth() + 1;
        const key = `${y}-${m}`;
        countByMonth.set(key, (countByMonth.get(key) ?? 0) + 1);
      }
      let total = 0;
      const months = monthList.map(({ year, month }) => {
        const key = `${year}-${month}`;
        const count = countByMonth.get(key) ?? 0;
        total += count;
        return {
          month: DashboardService.formatMonthLabel(year, month),
          count,
        };
      });
      return { category: label, months, total };
    });
  }

  async getHazardTypes(
    periodFrom?: string,
    periodTo?: string,
  ): Promise<HazardTypeData[]> {
    const incidentWhere: { isActive: boolean; incidentDate?: { gte?: Date; lte?: Date } } = {
      isActive: true,
    };
    if (periodFrom || periodTo) {
      incidentWhere.incidentDate = {};
      if (periodFrom) {
        const [y, m] = periodFrom.split('-').map(Number);
        incidentWhere.incidentDate.gte = new Date(y, m - 1, 1);
      }
      if (periodTo) {
        const [y, m] = periodTo.split('-').map(Number);
        incidentWhere.incidentDate.lte = new Date(y, m, 0, 23, 59, 59, 999);
      }
    }

    const inspectionWhere: { inspection: { isActive: boolean; inspectionDate?: { gte?: Date; lte?: Date } } } = {
      inspection: { isActive: true },
    };
    if (periodFrom || periodTo) {
      inspectionWhere.inspection.inspectionDate = {};
      if (periodFrom) {
        const [y, m] = periodFrom.split('-').map(Number);
        inspectionWhere.inspection.inspectionDate!.gte = new Date(y, m - 1, 1);
      }
      if (periodTo) {
        const [y, m] = periodTo.split('-').map(Number);
        inspectionWhere.inspection.inspectionDate!.lte = new Date(y, m, 0, 23, 59, 59, 999);
      }
    }

    const [incidents, inspectionItems] = await Promise.all([
      this.prisma.incident.findMany({
        where: incidentWhere,
        select: { riskCategory: { select: { name: true } } },
      }),
      this.prisma.inspectionItem.findMany({
        where: inspectionWhere,
        select: { riskCategory: { select: { name: true } } },
      }),
    ]);

    const countByName = new Map<string, number>();
    for (const i of incidents) {
      const name = i.riskCategory.name;
      countByName.set(name, (countByName.get(name) ?? 0) + 1);
    }
    for (const item of inspectionItems) {
      const name = item.riskCategory.name;
      countByName.set(name, (countByName.get(name) ?? 0) + 1);
    }
    return Array.from(countByName.entries()).map(([type, count]) => ({ type, count }));
  }

  async getNonConformanceCriteria(
    periodFrom?: string,
    periodTo?: string,
  ): Promise<NonConformanceCriteriaData[]> {
    const auditWhere: { isActive: boolean; auditDate?: { gte?: Date; lte?: Date } } = {
      isActive: true,
    };
    if (periodFrom || periodTo) {
      auditWhere.auditDate = {};
      if (periodFrom) {
        const [y, m] = periodFrom.split('-').map(Number);
        auditWhere.auditDate.gte = new Date(y, m - 1, 1);
      }
      if (periodTo) {
        const [y, m] = periodTo.split('-').map(Number);
        auditWhere.auditDate.lte = new Date(y, m, 0, 23, 59, 59, 999);
      }
    }

    const auditItems = await this.prisma.auditItem.findMany({
      where: {
        audit: auditWhere,
        compliantStatus: { in: [CompliantStatusEnum.NOT_COMPLY_MAJOR, CompliantStatusEnum.NOT_COMPLY_MINOR] },
        status: { not: GeneralStatusEnum.REJECTED },
      },
      include: { auditCriteria: { select: { name: true } } },
    });

    const countByName = new Map<string, number>();
    for (const item of auditItems) {
      const name = item.auditCriteria.name;
      countByName.set(name, (countByName.get(name) ?? 0) + 1);
    }
    return Array.from(countByName.entries()).map(([criteria, count]) => ({ criteria, count }));
  }

  async getTopUnsafeConditions(
    periodFrom?: string,
    periodTo?: string,
  ): Promise<TopUnsafeConditionData[]> {
    const inspectionWhere: { inspection: { isActive: boolean; inspectionDate?: { gte?: Date; lte?: Date } } } = {
      inspection: { isActive: true },
    };
    if (periodFrom || periodTo) {
      inspectionWhere.inspection.inspectionDate = {};
      if (periodFrom) {
        const [y, m] = periodFrom.split('-').map(Number);
        inspectionWhere.inspection.inspectionDate!.gte = new Date(y, m - 1, 1);
      }
      if (periodTo) {
        const [y, m] = periodTo.split('-').map(Number);
        inspectionWhere.inspection.inspectionDate!.lte = new Date(y, m, 0, 23, 59, 59, 999);
      }
    }

    const items = await this.prisma.inspectionItem.findMany({
      where: inspectionWhere,
      select: { risk: { select: { name: true } } },
    });

    const countByName = new Map<string, number>();
    for (const item of items) {
      const name = item.risk.name;
      countByName.set(name, (countByName.get(name) ?? 0) + 1);
    }
    return Array.from(countByName.entries())
      .map(([condition, reportCount]) => ({ condition, reportCount }))
      .sort((a, b) => b.reportCount - a.reportCount)
      .slice(0, 10);
  }

  async getResponsibleActions(
    periodFrom?: string,
    periodTo?: string,
  ): Promise<ResponsibleActionData[]> {
    const incidentWhere: { isActive: boolean; incidentDate?: { gte?: Date; lte?: Date } } = {
      isActive: true,
    };
    if (periodFrom || periodTo) {
      incidentWhere.incidentDate = {};
      if (periodFrom) {
        const [y, m] = periodFrom.split('-').map(Number);
        incidentWhere.incidentDate.gte = new Date(y, m - 1, 1);
      }
      if (periodTo) {
        const [y, m] = periodTo.split('-').map(Number);
        incidentWhere.incidentDate.lte = new Date(y, m, 0, 23, 59, 59, 999);
      }
    }

    const inspectionWhere: { inspection: { isActive: boolean; inspectionDate?: { gte?: Date; lte?: Date } } } = {
      inspection: { isActive: true },
    };
    if (periodFrom || periodTo) {
      inspectionWhere.inspection.inspectionDate = {};
      if (periodFrom) {
        const [y, m] = periodFrom.split('-').map(Number);
        inspectionWhere.inspection.inspectionDate!.gte = new Date(y, m - 1, 1);
      }
      if (periodTo) {
        const [y, m] = periodTo.split('-').map(Number);
        inspectionWhere.inspection.inspectionDate!.lte = new Date(y, m, 0, 23, 59, 59, 999);
      }
    }

    const [incidents, inspectionItems] = await Promise.all([
      this.prisma.incident.findMany({
        where: incidentWhere,
        select: { assignedDepartment: { select: { name: true } } },
      }),
      this.prisma.inspectionItem.findMany({
        where: inspectionWhere,
        select: { assignedDepartment: { select: { name: true } } },
      }),
    ]);

    const countByName = new Map<string, number>();
    for (const i of incidents) {
      const name = i.assignedDepartment.name;
      countByName.set(name, (countByName.get(name) ?? 0) + 1);
    }
    for (const item of inspectionItems) {
      const name = item.assignedDepartment.name;
      countByName.set(name, (countByName.get(name) ?? 0) + 1);
    }
    return Array.from(countByName.entries()).map(([action, count]) => ({ action, count }));
  }

  private static buildPeriodDates(periodFrom?: string, periodTo?: string): {
    gte?: Date;
    lte?: Date;
  } {
    const incidentDate: { gte?: Date; lte?: Date } = {};
    if (periodFrom) {
      const [y, m] = periodFrom.split('-').map(Number);
      incidentDate.gte = new Date(y, m - 1, 1);
    }
    if (periodTo) {
      const [y, m] = periodTo.split('-').map(Number);
      incidentDate.lte = new Date(y, m, 0, 23, 59, 59, 999);
    }
    return incidentDate;
  }

  private static previousPeriod(periodFrom?: string, periodTo?: string): {
    periodFrom: string;
    periodTo: string;
  } | null {
    if (!periodFrom || !periodTo) return null;
    const [yFrom, mFrom] = periodFrom.split('-').map(Number);
    const [yTo, mTo] = periodTo.split('-').map(Number);
    return {
      periodFrom: `${yFrom - 1}-${String(mFrom).padStart(2, '0')}`,
      periodTo: `${yTo - 1}-${String(mTo).padStart(2, '0')}`,
    };
  }

  private static classifySecurityIncident(
    classification: IncidentClassificationEnum,
    injuredLevels: LevelOfInjuryEnum[],
  ): 'major' | 'moderate' | 'minor' {
    if (
      classification === IncidentClassificationEnum.MAJOR ||
      classification === IncidentClassificationEnum.FATALITY
    )
      return 'major';
    if (classification === IncidentClassificationEnum.MINOR) {
      const hasModerate = injuredLevels.some((l) => l === LevelOfInjuryEnum.MODERATE);
      return hasModerate ? 'moderate' : 'minor';
    }
    return 'minor';
  }

  async getSecurityIncidentSummary(
    periodFrom?: string,
    periodTo?: string,
  ): Promise<SecurityIncidentSummaryData[]> {
    const currentDates = DashboardService.buildPeriodDates(periodFrom, periodTo);
    const currentWhere = {
      isActive: true,
      type: IncidentScopeEnum.SECURITY,
      ...(currentDates.gte != null || currentDates.lte != null ? { incidentDate: currentDates } : {}),
    };
    const prev = DashboardService.previousPeriod(periodFrom, periodTo);
    const previousWhere =
      prev && (periodFrom || periodTo)
        ? {
            isActive: true,
            type: IncidentScopeEnum.SECURITY,
            incidentDate: DashboardService.buildPeriodDates(prev.periodFrom, prev.periodTo),
          }
        : null;

    const select = {
      incidentClassification: true,
      injuredPersons: { select: { levelOfInjury: true } },
    };

    const [currentIncidents, previousIncidents] = await Promise.all([
      this.prisma.incident.findMany({
        where: currentWhere,
        select,
      }),
      previousWhere
        ? this.prisma.incident.findMany({
            where: previousWhere,
            select,
          })
        : Promise.resolve([]),
    ]);

    const count = (
      incidents: Array<{
        incidentClassification: IncidentClassificationEnum;
        injuredPersons: Array<{ levelOfInjury: LevelOfInjuryEnum }>;
      }>,
    ) => {
      let major = 0;
      let moderate = 0;
      let minor = 0;
      for (const i of incidents) {
        const levels = i.injuredPersons.map((p) => p.levelOfInjury);
        const cat = DashboardService.classifySecurityIncident(
          i.incidentClassification,
          levels,
        );
        if (cat === 'major') major += 1;
        else if (cat === 'moderate') moderate += 1;
        else minor += 1;
      }
      return { major, moderate, minor, total: incidents.length };
    };

    const curr = count(currentIncidents);
    const prevCounts = previousIncidents.length
      ? count(previousIncidents)
      : { major: 0, moderate: 0, minor: 0, total: 0 };

    return [
      {
        category: 'Major Incident',
        count: curr.major,
        difference: curr.major - prevCounts.major,
      },
      {
        category: 'Moderate Incident',
        count: curr.moderate,
        difference: curr.moderate - prevCounts.moderate,
      },
      {
        category: 'Minor Incident',
        count: curr.minor,
        difference: curr.minor - prevCounts.minor,
      },
      {
        category: 'Total Incident',
        count: curr.total,
        difference: curr.total - prevCounts.total,
      },
    ];
  }

  async getSecurityCaseStatus(
    periodFrom?: string,
    periodTo?: string,
  ): Promise<HazardStatusData> {
    const incidentDate = DashboardService.buildPeriodDates(periodFrom, periodTo);
    const where: { isActive: boolean; type: IncidentScopeEnum; incidentDate?: { gte?: Date; lte?: Date } } = {
      isActive: true,
      type: IncidentScopeEnum.SECURITY,
      ...(incidentDate.gte != null || incidentDate.lte != null ? { incidentDate } : {}),
    };
    const incidents = await this.prisma.incident.findMany({
      where,
      select: { status: true },
    });
    let open = 0;
    let closed = 0;
    for (const { status } of incidents) {
      if (DashboardService.OPEN_STATUSES.includes(status)) open += 1;
      else if (DashboardService.CLOSED_STATUSES.includes(status)) closed += 1;
    }
    return { open, closed, total: open + closed };
  }

  private static readonly MONTH_TO_NUM: Record<MonthEnum, number> = {
    [MonthEnum.JAN]: 1,
    [MonthEnum.FEB]: 2,
    [MonthEnum.MAR]: 3,
    [MonthEnum.APR]: 4,
    [MonthEnum.MAY]: 5,
    [MonthEnum.JUN]: 6,
    [MonthEnum.JUL]: 7,
    [MonthEnum.AUG]: 8,
    [MonthEnum.SEP]: 9,
    [MonthEnum.OCT]: 10,
    [MonthEnum.NOV]: 11,
    [MonthEnum.DEC]: 12,
  };

  async getSecuritySifrComparison(): Promise<SecuritySifrComparisonData[]> {
    const [manHoursRows, incidents] = await Promise.all([
      this.prisma.manHour.findMany({
        where: { isActive: true },
        select: { year: true, month: true, total: true },
      }),
      this.prisma.incident.findMany({
        where: { isActive: true, type: IncidentScopeEnum.SECURITY },
        select: {
          incidentDate: true,
          incidentClassification: true,
          injuredPersons: { select: { levelOfInjury: true } },
        },
      }),
    ]);

    const manHoursByYear = new Map<string, number>();
    for (const row of manHoursRows) {
      const monthNum = DashboardService.MONTH_TO_NUM[row.month];
      const academicYear =
        monthNum >= 8 ? `${row.year}-${row.year + 1}` : `${row.year - 1}-${row.year}`;
      const total = Number(row.total);
      manHoursByYear.set(academicYear, (manHoursByYear.get(academicYear) ?? 0) + total);
    }

    const incidentsByYear = new Map<
      string,
      { major: number; moderate: number; minor: number; total: number }
    >();
    for (const i of incidents) {
      const d = i.incidentDate;
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      const academicYear =
        month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
      const levels = i.injuredPersons.map((p) => p.levelOfInjury);
      const cat = DashboardService.classifySecurityIncident(
        i.incidentClassification,
        levels,
      );
      let row = incidentsByYear.get(academicYear);
      if (!row) {
        row = { major: 0, moderate: 0, minor: 0, total: 0 };
        incidentsByYear.set(academicYear, row);
      }
      row.total += 1;
      if (cat === 'major') row.major += 1;
      else if (cat === 'moderate') row.moderate += 1;
      else row.minor += 1;
    }

    const academicYears = Array.from(
      new Set([...manHoursByYear.keys(), ...incidentsByYear.keys()]),
    ).sort();

    const round2 = (n: number) => Math.round(n * 100) / 100;

    return academicYears.map((year) => {
      const mh = manHoursByYear.get(year) ?? 0;
      const inc = incidentsByYear.get(year) ?? {
        major: 0,
        moderate: 0,
        minor: 0,
        total: 0,
      };
      const rate = mh > 0 ? (1_000_000 / mh) : 0;
      return {
        year,
        totalSifr: round2(inc.total * rate),
        majorRate: round2(inc.major * rate),
        moderateRate: round2(inc.moderate * rate),
        minorRate: round2(inc.minor * rate),
      };
    });
  }

  private static buildMonthLabelsFromPeriod(
    periodFrom: string,
    periodTo: string,
  ): string[] {
    const [yFrom, mFrom] = periodFrom.split('-').map(Number);
    const [yTo, mTo] = periodTo.split('-').map(Number);
    const labels: string[] = [];
    let y = yFrom;
    let m = mFrom;
    while (y < yTo || (y === yTo && m <= mTo)) {
      labels.push(
        `${DashboardService.MONTH_ABBREV[m - 1]} ${y}`,
      );
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    }
    return labels;
  }

  async getSecurityMonthlyIncidents(
    periodFrom?: string,
    periodTo?: string,
  ): Promise<SecurityMonthlyIncidentsData> {
    let from = periodFrom;
    let to = periodTo;
    if (!from || !to) {
      const now = new Date();
      to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const past = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      from = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}`;
    }
    const monthLabels = DashboardService.buildMonthLabelsFromPeriod(from, to);
    const incidentDate = DashboardService.buildPeriodDates(from, to);
    const incidents = await this.prisma.incident.findMany({
      where: {
        isActive: true,
        type: IncidentScopeEnum.SECURITY,
        incidentDate,
      },
      select: {
        incidentDate: true,
        incidentClassification: true,
        injuredPersons: { select: { levelOfInjury: true } },
      },
    });

    type Key = string;
    const countByCategoryMonth = new Map<Key, number>();
    const totalByCategory = new Map<string, number>();
    const categoryOrder = ['Minor', 'Moderate', 'Major', 'Total Incident'];
    for (const cat of categoryOrder) {
      totalByCategory.set(cat, 0);
    }

    for (const i of incidents) {
      const d = i.incidentDate;
      const monthLabel =
        `${DashboardService.MONTH_ABBREV[d.getMonth()]} ${d.getFullYear()}`;
      const levels = i.injuredPersons.map((p) => p.levelOfInjury);
      const cat = DashboardService.classifySecurityIncident(
        i.incidentClassification,
        levels,
      );
      const categoryLabel =
        cat === 'major' ? 'Major' : cat === 'moderate' ? 'Moderate' : 'Minor';
      const keyCategoryMonth = `${categoryLabel}\t${monthLabel}`;
      countByCategoryMonth.set(
        keyCategoryMonth,
        (countByCategoryMonth.get(keyCategoryMonth) ?? 0) + 1,
      );
      totalByCategory.set(
        categoryLabel,
        (totalByCategory.get(categoryLabel) ?? 0) + 1,
      );
      const keyTotal = `Total Incident\t${monthLabel}`;
      countByCategoryMonth.set(
        keyTotal,
        (countByCategoryMonth.get(keyTotal) ?? 0) + 1,
      );
      totalByCategory.set(
        'Total Incident',
        (totalByCategory.get('Total Incident') ?? 0) + 1,
      );
    }

    return categoryOrder.map((category) => {
      const months = monthLabels.map((month) => ({
        month,
        count: countByCategoryMonth.get(`${category}\t${month}`) ?? 0,
      }));
      const total = totalByCategory.get(category) ?? 0;
      return { category, months, total };
    });
  }

  async getSecurityTypeNonConformance(
    periodFrom?: string,
    periodTo?: string,
  ): Promise<SecurityTypeNonConformanceData[]> {
    const where: {
      isActive: boolean;
      type: IncidentScopeEnum;
      riskCategory: { code: { startsWith: string } };
      incidentDate?: { gte?: Date; lte?: Date };
    } = {
      isActive: true,
      type: IncidentScopeEnum.SECURITY,
      riskCategory: { code: { startsWith: 'SEC-' } },
    };
    if (periodFrom || periodTo) {
      where.incidentDate = {};
      if (periodFrom) {
        const [y, m] = periodFrom.split('-').map(Number);
        where.incidentDate.gte = new Date(y, m - 1, 1);
      }
      if (periodTo) {
        const [y, m] = periodTo.split('-').map(Number);
        where.incidentDate.lte = new Date(y, m, 0, 23, 59, 59, 999);
      }
    }

    const incidents = await this.prisma.incident.findMany({
      where,
      select: { riskCategory: { select: { name: true, code: true } } },
    });

    const countByName = new Map<string, number>();
    for (const i of incidents) {
      const name = i.riskCategory.name;
      countByName.set(name, (countByName.get(name) ?? 0) + 1);
    }
    return Array.from(countByName.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }

  private mapDepartmentToParty(name: string, code: string): string {
    const n = name.toLowerCase();
    const c = code.toLowerCase();
    if (n.includes('staff') || c.includes('stf')) return 'Staff';
    if (n.includes('student') || c.includes('std')) return 'Students';
    if (n.includes('parent') || n.includes('family')) return 'Parents / Family';
    if (n.includes('household')) return 'Household staff';
    if (n.includes('visitor')) return 'Visitors';
    if (n.includes('vendor')) return 'Vendors';
    if (n.includes('contractor')) return 'Contractors';
    if (n.includes('external')) return 'External';
    return 'Others';
  }

  async getSecurityPartiesInvolved(
    periodFrom?: string,
    periodTo?: string,
  ): Promise<SecurityPartiesInvolvedData[]> {
    const where: { isActive: boolean; type: IncidentScopeEnum; incidentDate?: { gte?: Date; lte?: Date } } = {
      isActive: true,
      type: IncidentScopeEnum.SECURITY,
    };
    if (periodFrom || periodTo) {
      where.incidentDate = {};
      if (periodFrom) {
        const [y, m] = periodFrom.split('-').map(Number);
        where.incidentDate.gte = new Date(y, m - 1, 1);
      }
      if (periodTo) {
        const [y, m] = periodTo.split('-').map(Number);
        where.incidentDate.lte = new Date(y, m, 0, 23, 59, 59, 999);
      }
    }

    const incidents = await this.prisma.incident.findMany({
      where,
      select: {
        injuredPersons: { select: { departmentId: true } },
        witnesses: { select: { departmentId: true } },
      },
    });

    const partyCounts = new Map<string, number>();

    const departmentIds = new Set<string>();
    for (const incident of incidents) {
      for (const p of incident.injuredPersons) {
        if (p.departmentId) departmentIds.add(p.departmentId);
      }
      for (const w of incident.witnesses) {
        if (w.departmentId) departmentIds.add(w.departmentId);
      }
    }

    const departments =
      departmentIds.size > 0
        ? await this.prisma.department.findMany({
            where: { id: { in: Array.from(departmentIds) } },
            select: { id: true, name: true, code: true },
          })
        : [];
    const deptById = new Map(departments.map((d) => [d.id, d]));

    for (const incident of incidents) {
      const seenParties = new Set<string>();
      for (const p of incident.injuredPersons) {
        const label = p.departmentId
          ? this.mapDepartmentToParty(
              deptById.get(p.departmentId)?.name ?? '',
              deptById.get(p.departmentId)?.code ?? '',
            )
          : 'External';
        if (!seenParties.has(label)) {
          seenParties.add(label);
          partyCounts.set(label, (partyCounts.get(label) ?? 0) + 1);
        }
      }
      for (const w of incident.witnesses) {
        const label = w.departmentId
          ? this.mapDepartmentToParty(
              deptById.get(w.departmentId)?.name ?? '',
              deptById.get(w.departmentId)?.code ?? '',
            )
          : 'External';
        if (!seenParties.has(label)) {
          seenParties.add(label);
          partyCounts.set(label, (partyCounts.get(label) ?? 0) + 1);
        }
      }
    }

    return Array.from(partyCounts.entries())
      .map(([party, count]) => ({ party, count }))
      .sort((a, b) => b.count - a.count);
  }

  private static readonly MECHANISM_LABEL: Record<MechanismOfInjuryEnum, string> = {
    [MechanismOfInjuryEnum.NOT_SPECIFIED]: 'Not specified',
    [MechanismOfInjuryEnum.STRUCK_BY]: 'Struck by or caught between objects',
    [MechanismOfInjuryEnum.FAILING_OBJECT]: 'Got hit by falling object',
    [MechanismOfInjuryEnum.TRIP]: 'Fall (tripped or slipped)',
    [MechanismOfInjuryEnum.SLIP]: 'Fall (tripped or slipped)',
    [MechanismOfInjuryEnum.FALL]: 'Fall (tripped or slipped)',
    [MechanismOfInjuryEnum.CHEMICAL]: 'Chemical exposure',
    [MechanismOfInjuryEnum.VEHICLES]: 'Vehicle accident',
    [MechanismOfInjuryEnum.MECHINARY]: 'Injury caused by machinery',
    [MechanismOfInjuryEnum.ELECTRICITY]: 'Injury caused by electricity',
    [MechanismOfInjuryEnum.HAND_TOOLS]: 'Got cut due to sharp edge material',
    [MechanismOfInjuryEnum.FALL_FROM_HEIGHT]: 'Fall from height',
    [MechanismOfInjuryEnum.FLYING_OBJECT]: 'Eye injury caused by flying particles',
    [MechanismOfInjuryEnum.OTHER]: 'Other',
  };

  private static readonly FISCAL_YEAR_START = 2020;

  /** Fiscal year keys from 2020-2021 through current FY (Aug–Jul). */
  private static getFiscalYearKeys(now: Date = new Date()): string[] {
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const currentFY = month >= 8 ? year : year - 1;
    const keys: string[] = [];
    for (let y = DashboardService.FISCAL_YEAR_START; y <= currentFY; y++) {
      keys.push(`year${y}_${y + 1}`);
    }
    return keys;
  }

  private static getFiscalYearDateRanges(now: Date = new Date()): Record<string, { gte: Date; lte: Date }> {
    const keys = DashboardService.getFiscalYearKeys(now);
    const record: Record<string, { gte: Date; lte: Date }> = {};
    for (const key of keys) {
      const match = key.match(/^year(\d+)_(\d+)$/);
      if (match) {
        const y = Number(match[1]);
        record[key] = {
          gte: new Date(y, 7, 1),
          lte: new Date(y + 1, 6, 31, 23, 59, 59, 999),
        };
      }
    }
    return record;
  }

  /** Returns fiscal year key (e.g. year2024_2025) for date, or null if outside 2020..current FY. */
  private static getFiscalYearKey(date: Date, now: Date = new Date()): string | null {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const fyStart = month >= 8 ? year : year - 1;
    const fyEnd = fyStart + 1;
    if (fyStart < DashboardService.FISCAL_YEAR_START) return null;
    const keys = DashboardService.getFiscalYearKeys(now);
    const key = `year${fyStart}_${fyEnd}`;
    return keys.includes(key) ? key : null;
  }

  private static parseFiscalYearsParam(
    fiscalYears: string | string[] | undefined,
    now: Date = new Date(),
  ): string[] {
    const allowed = DashboardService.getFiscalYearKeys(now);
    if (!fiscalYears) return [...allowed];
    const arr = Array.isArray(fiscalYears) ? fiscalYears : fiscalYears.split(',').map((s) => s.trim());
    const valid = allowed.filter((fy) => arr.includes(fy));
    return valid.length > 0 ? valid : [...allowed];
  }

  async getIncidentProfile(fiscalYearsParam?: string | string[]): Promise<IncidentProfileData> {
    const now = new Date();
    const selectedYears = DashboardService.parseFiscalYearsParam(fiscalYearsParam, now);
    const dateRangesMap = DashboardService.getFiscalYearDateRanges(now);
    const dateRanges = selectedYears
      .map((fy) => dateRangesMap[fy])
      .filter((r): r is { gte: Date; lte: Date } => r != null);
    const dateFilter =
      dateRanges.length > 0
        ? {
            OR: dateRanges.map((r) => ({
              incidentDate: { gte: r.gte, lte: r.lte },
            })),
          }
        : undefined;

    const where = {
      isActive: true,
      incidentType: IncidentTypeEnum.ACCIDENT,
      incidentClassification: IncidentClassificationEnum.MINOR,
      ...(dateFilter && { ...dateFilter }),
    };

    const incidents = await this.prisma.incident.findMany({
      where,
      select: {
        incidentDate: true,
        injuredPersons: {
          select: { mechanismOfInjury: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    const yearsToShow = selectedYears;
    const emptyRow = (): Record<string, number> => {
      const row: Record<string, number> = {};
      for (const fy of yearsToShow) row[fy] = 0;
      return row;
    };
    const countMap = new Map<string, Record<string, number>>();

    for (const incident of incidents) {
      const mechanism =
        incident.injuredPersons[0]?.mechanismOfInjury ?? MechanismOfInjuryEnum.NOT_SPECIFIED;
      const category = DashboardService.MECHANISM_LABEL[mechanism];
      const fyKey = DashboardService.getFiscalYearKey(incident.incidentDate, now);
      if (!fyKey) continue;

      let row = countMap.get(category);
      if (!row) {
        row = emptyRow();
        countMap.set(category, row);
      }
      row[fyKey] = (row[fyKey] ?? 0) + 1;
    }

    const countData: IncidentCategoryData[] = Array.from(countMap.entries())
      .map(([category, counts]) => {
        const row: IncidentCategoryData = { category };
        for (const fy of yearsToShow) {
          row[fy] = counts[fy] ?? 0;
        }
        return row;
      })
      .filter((row) => yearsToShow.some((fy) => Number(row[fy] ?? 0) > 0))
      .sort((a, b) => {
        const totalA = yearsToShow.reduce((s, fy) => s + Number(a[fy] ?? 0), 0);
        const totalB = yearsToShow.reduce((s, fy) => s + Number(b[fy] ?? 0), 0);
        return totalB - totalA;
      });

    const percentageData: IncidentCategoryData[] = countData.map((row) => {
      const total = yearsToShow.reduce((s, fy) => s + Number(row[fy] ?? 0), 0);
      const out: IncidentCategoryData = { category: row.category };
      if (total === 0) {
        for (const fy of yearsToShow) out[fy] = 0;
        return out;
      }
      for (const fy of yearsToShow) {
        out[fy] = Math.round((Number(row[fy] ?? 0) / total) * 1000) / 10;
      }
      return out;
    });

    return {
      countData,
      percentageData,
      yearsToShow: [...yearsToShow],
    };
  }

  async getAdminOverview(): Promise<AdminOverviewData> {
    const cached = this.adminOverviewCache;
    if (cached && Date.now() < cached.expiresAtMs) {
      return cached.value;
    }

    const now = new Date();
    const in30Days = new Date(now);
    in30Days.setDate(in30Days.getDate() + 30);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();
    const monthEnumValues: MonthEnum[] = [
      MonthEnum.JAN, MonthEnum.FEB, MonthEnum.MAR, MonthEnum.APR, MonthEnum.MAY, MonthEnum.JUN,
      MonthEnum.JUL, MonthEnum.AUG, MonthEnum.SEP, MonthEnum.OCT, MonthEnum.NOV, MonthEnum.DEC,
    ];
    const currentMonthEnum = monthEnumValues[currentMonthIndex];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentPeriodLabel = `${monthNames[currentMonthIndex]} ${currentYear}`;

    const [
      overdueEnrollments,
      totalEnrollments,
      completedEnrollments,
      quizAttemptsPassed,
      quizAttemptsTotal,
      certificatesExpiringIn30Days,
      certificatesTotalActive,
      renewalBacklog,
      certificateCategoriesGroup,
      ppeLowStockItems,
      ppeExpiringItems,
      ppeWithdrawalsPending,
      ppeWithdrawalItemsForTop,
      wpPendingApproval,
      wpApproved,
      wpRejected,
      wpTotal,
      totalRooms,
      roomsMeasuredLast30DaysGroup,
      readingsCountLast30Days,
      manHoursCurrentMonthRows,
      manHoursSameMonthLastYearRows,
      flowPending,
      waterQualityPending,
      weightReportPending,
      flowTotal,
      waterQualityTotal,
      weightReportTotal,
      weightReportItemsCurrentYear,
      treatmentPlantCount,
      flowSubmittedCurrentYear,
    ] = await Promise.all([
      this.prisma.enrollment.count({
        where: {
          dueDate: { lt: now, not: null },
          status: {
            notIn: [
              EnrollmentStatusEnum.COMPLETED,
              EnrollmentStatusEnum.CANCELLED,
              EnrollmentStatusEnum.EXPIRED,
            ],
          },
        },
      }),
      this.prisma.enrollment.count(),
      this.prisma.enrollment.count({
        where: { status: EnrollmentStatusEnum.COMPLETED },
      }),
      this.prisma.quizAttempt.count({
        where: { isPassed: true },
      }),
      this.prisma.quizAttempt.count(),
      this.prisma.certificate.count({
        where: {
          isActive: true,
          deletedAt: null,
          validityDate: { gte: now, lte: in30Days },
        },
      }),
      this.prisma.certificate.count({
        where: { isActive: true, deletedAt: null },
      }),
      this.prisma.certificateRenewal.count({
        where: {
          status: {
            in: [
              CertificateRenewalStatusEnum.PENDING,
              CertificateRenewalStatusEnum.REQUESTED,
              CertificateRenewalStatusEnum.IN_PROGRESS,
            ],
          },
        },
      }),
      this.prisma.certificate.groupBy({
        by: ['categoryId'],
        where: { isActive: true, deletedAt: null },
      }),
      this.prisma.pPEStockItem.count({
        where: {
          currentQuantity: { gt: 0, lte: 5 },
          stock: { isActive: true, deletedAt: null },
        },
      }),
      this.prisma.pPEStockItem.count({
        where: {
          expiryDate: { gte: now, lte: in30Days },
          status: {
            in: [
              PPEStockStatusEnum.AVAILABLE,
              PPEStockStatusEnum.RESERVED,
              PPEStockStatusEnum.ISSUED,
            ],
          },
          stock: { isActive: true, deletedAt: null },
        },
      }),
      this.prisma.pPEWithdrawal.count({
        where: {
          status: PPEWithdrawalStatusEnum.PENDING,
          deletedAt: null,
        },
      }),
      this.prisma.pPEWithdrawalItem.findMany({
        include: {
          stockItem: { include: { safetyEquipment: true } },
        },
      }),
      this.prisma.workPermit.count({
        where: {
          isActive: true,
          status: {
            in: ['WAITING_APPROVAL', 'IN_REVIEW_HSE', 'IN_REVIEW_SECURITY'],
          },
        },
      }),
      this.prisma.workPermit.count({
        where: { isActive: true, status: 'APPROVED' },
      }),
      this.prisma.workPermit.count({
        where: { status: 'REJECTED' },
      }),
      this.prisma.workPermit.count(),
      this.prisma.room.count({ where: { isActive: true } }),
      this.prisma.environmentalMeasurement.groupBy({
        by: ['roomId'],
        where: {
          date: { gte: thirtyDaysAgo },
          isActive: true,
        },
      }),
      this.prisma.environmentalMeasurement.count({
        where: {
          date: { gte: thirtyDaysAgo },
          isActive: true,
        },
      }),
      this.prisma.manHour.findMany({
        where: { month: currentMonthEnum, year: currentYear, isActive: true },
        select: { total: true, group: true },
      }),
      this.prisma.manHour.findMany({
        where: { month: currentMonthEnum, year: currentYear - 1, isActive: true },
        select: { total: true },
      }),
      this.prisma.monthlyFlowReport.count({
        where: {
          isActive: true,
          status: { in: [ReportStatusEnum.SUBMITTED, ReportStatusEnum.UNDER_REVIEW] },
        },
      }),
      this.prisma.waterQualityLabReport.count({
        where: {
          isActive: true,
          status: { in: [WaterQualityLabReportStatusEnum.DRAFT, WaterQualityLabReportStatusEnum.WAITING_APPROVAL] },
        },
      }),
      this.prisma.weightReport.count({
        where: {
          isActive: true,
          status: { in: [WeightReportStatusEnum.OPEN, WeightReportStatusEnum.WAITING_APPROVAL] },
        },
      }),
      this.prisma.monthlyFlowReport.count({ where: { isActive: true } }),
      this.prisma.waterQualityLabReport.count({ where: { isActive: true } }),
      this.prisma.weightReport.count({ where: { isActive: true } }),
      this.prisma.weightReportItem.findMany({
        where: { weightReport: { reportYear: currentYear, isActive: true } },
        select: { weight: true },
      }),
      this.prisma.treatmentPlant.count({ where: { isActive: true } }),
      this.prisma.monthlyFlowReport.count({
        where: { reportYear: currentYear, isActive: true },
      }),
    ]);

    const courseCompletionRate =
      totalEnrollments > 0
        ? Math.round((completedEnrollments / totalEnrollments) * 100)
        : 0;
    const quizPassRate =
      quizAttemptsTotal > 0
        ? Math.round((quizAttemptsPassed / quizAttemptsTotal) * 100)
        : 0;
    const categoriesCount = certificateCategoriesGroup.length;

    const equipmentQuantityMap = new Map<string, number>();
    for (const wi of ppeWithdrawalItemsForTop) {
      const name =
        wi.stockItem.equipmentName ??
        wi.stockItem.safetyEquipment?.name ??
        'Unknown';
      const qty =
        wi.issuedQuantity ?? wi.approvedQuantity ?? wi.requestedQuantity;
      equipmentQuantityMap.set(name, (equipmentQuantityMap.get(name) ?? 0) + qty);
    }
    const topEquipmentEntry =
      equipmentQuantityMap.size > 0
        ? [...equipmentQuantityMap.entries()].sort(
            (a, b) => b[1] - a[1],
          )[0]
        : null;
    const topEquipmentByWithdrawal = topEquipmentEntry
      ? `${topEquipmentEntry[0]}: ${topEquipmentEntry[1]}`
      : '—';

    const rejectionRate =
      wpTotal > 0 ? Math.round((wpRejected / wpTotal) * 100) : 0;

    const roomsMeasuredCount = roomsMeasuredLast30DaysGroup.length;
    const roomsNotMeasured = Math.max(0, totalRooms - roomsMeasuredCount);
    const coveragePercent =
      totalRooms > 0 ? Math.round((roomsMeasuredCount / totalRooms) * 100) : 0;

    const totalManHoursCurrent = manHoursCurrentMonthRows.reduce(
      (sum, r) => sum + Number(r.total),
      0,
    );
    const studentManHours = manHoursCurrentMonthRows
      .filter((r) => r.group === 'STUDENT')
      .reduce((sum, r) => sum + Number(r.total), 0);
    const nonStudentManHours = manHoursCurrentMonthRows
      .filter((r) => r.group === 'NON_STUDENT')
      .reduce((sum, r) => sum + Number(r.total), 0);
    const totalManHoursPrevYear = manHoursSameMonthLastYearRows.reduce(
      (sum, r) => sum + Number(r.total),
      0,
    );
    const yoyChangePercent =
      totalManHoursPrevYear > 0
        ? Math.round(
            ((totalManHoursCurrent - totalManHoursPrevYear) /
              totalManHoursPrevYear) *
              100,
          )
        : 0;

    const reportsPendingReview =
      flowPending + waterQualityPending + weightReportPending;
    const totalReports = flowTotal + waterQualityTotal + weightReportTotal;
    const expectedFlowReports = treatmentPlantCount * 12;
    const missingReports = Math.max(
      0,
      expectedFlowReports - flowSubmittedCurrentYear,
    );
    const totalWasteWeightKg = weightReportItemsCurrentYear.reduce(
      (sum, i) => sum + Number(i.weight),
      0,
    );

    const result: AdminOverviewData = {
      lms: {
        overdueEnrollments,
        totalEnrollments,
        courseCompletionRate,
        quizPassRate,
      },
      certificates: {
        expiringIn30Days: certificatesExpiringIn30Days,
        totalActive: certificatesTotalActive,
        renewalBacklog,
        categoriesCount,
      },
      ppe: {
        lowStockItems: ppeLowStockItems,
        expiringItems: ppeExpiringItems,
        withdrawalsPending: ppeWithdrawalsPending,
        topEquipmentByWithdrawal,
      },
      workPermits: {
        pendingApproval: wpPendingApproval,
        totalActive: wpTotal,
        activePermits: wpApproved,
        rejectionRate,
      },
      environmental: {
        roomsNotMeasured,
        totalRooms,
        coveragePercent,
        avgReadingsRecorded: readingsCountLast30Days,
      },
      wasteManagement: {
        reportsPendingReview,
        totalReports,
        missingReports,
        totalWasteWeightKg: Math.round(totalWasteWeightKg),
      },
      manHours: {
        totalManHours: Math.round(totalManHoursCurrent),
        currentPeriod: currentPeriodLabel,
        studentManHours: Math.round(studentManHours),
        nonStudentManHours: Math.round(nonStudentManHours),
        yoyChangePercent,
      },
    };

    // Simple in-process TTL cache to reduce repeated heavy DB queries during development.
    // Kept intentionally short to avoid staleness concerns.
    this.adminOverviewCache = { value: result, expiresAtMs: Date.now() + 30_000 };

    return result;
  }
} 