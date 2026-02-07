import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import {
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
} 