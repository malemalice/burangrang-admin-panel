import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import {
  CompliantStatusEnum,
  GeneralStatusEnum,
  IncidentClassificationEnum,
  IncidentTypeEnum,
  RiskRatingEnum,
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
} from '../types/dashboard.types';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getRiskOverview(): Promise<RiskOverview> {
    const [totalAssessments, riskItems, recentAssessments] = await Promise.all([
      // Get total assessments
      this.prisma.riskAssessment.count({
        where: { isActive: true },
      }),
      // Get risk distribution
      this.prisma.riskAssessmentItem.groupBy({
        by: ['riskMatrixRating'],
        _count: true,
      }),
      // Get recent assessments
      this.prisma.riskAssessment.findMany({
        where: { isActive: true },
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
        where: { departmentId, isActive: true },
      }),
      // Get risk distribution
      this.prisma.riskAssessmentItem.findMany({
        where: {
          riskAssessment: {
            departmentId,
            isActive: true,
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
            riskAssessment: { isActive: true },
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
      where: { isActive: true },
      include: {
        riskCategory: true,
        riskAssessmentItems: {
          where: {
            riskAssessment: { isActive: true },
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
        where: { isActive: true },
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

    const incidents = await this.prisma.incident.findMany({
      where,
      select: {
        incidentType: true,
        incidentClassification: true,
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

    return categories.map(({ label, filter }) => {
      const actual = incidents.filter(filter).length;
      return {
        category: label,
        actual,
        target: -actual,
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
} 