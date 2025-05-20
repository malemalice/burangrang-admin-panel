import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/services/prisma.service';
import { RiskRatingEnum } from '@prisma/client';
import {
  RiskOverview,
  DepartmentProfile,
  HseCategoryAnalysis,
  ThreatAnalysis,
  ComplianceProgress,
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

    const approvedAssessments = assessments.filter((a) => a.status === 'APPROVED').length;

    return {
      departmentId,
      name: department?.name ?? '',
      totalAssessments: assessments.length,
      riskDistribution,
      complianceRate: assessments.length ? (approvedAssessments / assessments.length) * 100 : 0,
    };
  }

  async getHseCategoryAnalysis(): Promise<HseCategoryAnalysis[]> {
    const categories = await this.prisma.hseCategory.findMany({
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

  async getThreatAnalysis(): Promise<ThreatAnalysis[]> {
    const threats = await this.prisma.threat.findMany({
      where: { isActive: true },
      include: {
        hseCategory: true,
        riskAssessmentItems: {
          where: {
            riskAssessment: { isActive: true },
          },
        },
      },
    });

    return threats.map((threat) => {
      const occurrences = threat.riskAssessmentItems.length;
      
      // Calculate average risk rating
      const ratingCounts = Object.values(RiskRatingEnum).reduce(
        (acc, rating) => ({
          ...acc,
          [rating]: threat.riskAssessmentItems.filter(
            (item) => item.riskMatrixRating === rating,
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
        threatId: threat.id,
        name: threat.name,
        category: threat.hseCategory.name,
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
    const approvedAssessments = assessments.filter((a) => a.status === 'APPROVED').length;
    const pendingAssessments = assessments.filter((a) => a.status === 'PENDING').length;
    const rejectedAssessments = assessments.filter((a) => a.status === 'REJECTED').length;

    const departmentCompliance = departments.map((dept) => {
      const deptAssessments = assessments.filter((a) => a.departmentId === dept.id);
      const deptApproved = deptAssessments.filter((a) => a.status === 'APPROVED').length;
      
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
} 