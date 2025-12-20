import api from '@/core/lib/api';

export interface RiskDistribution {
  LOW: number;
  MEDIUM: number;
  HIGH: number;
  EXTREME: number;
}

export interface RecentAssessment {
  id: string;
  code: string;
  department: string;
  status: string;
  assessmentDate: Date;
}

export interface RiskOverview {
  totalAssessments: number;
  riskDistribution: RiskDistribution;
  recentAssessments: RecentAssessment[];
}

export interface DepartmentProfile {
  departmentId: string;
  name: string;
  totalAssessments: number;
  riskDistribution: RiskDistribution;
  complianceRate: number;
}

export interface RiskCategoryAnalysis {
  categoryId: string;
  name: string;
  totalOccurrences: number;
  riskDistribution: RiskDistribution;
}

export interface RiskAnalysis {
  riskId: string;
  name: string;
  category: string;
  occurrences: number;
  averageRiskRating: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
}

export interface DepartmentCompliance {
  departmentId: string;
  name: string;
  complianceRate: number;
}

export interface ComplianceProgress {
  totalAssessments: number;
  approvedAssessments: number;
  pendingAssessments: number;
  rejectedAssessments: number;
  complianceRate: number;
  departmentCompliance: DepartmentCompliance[];
}

const DashboardService = {
  getRiskOverview: async (): Promise<RiskOverview> => {
    const { data } = await api.get('/dashboard/risk-overview');
    return data;
  },

  getDepartmentProfile: async (departmentId: string): Promise<DepartmentProfile> => {
    const { data } = await api.get(`/dashboard/department-profile/${departmentId}`);
    return data;
  },

  getRiskCategoryAnalysis: async (): Promise<RiskCategoryAnalysis[]> => {
    const { data } = await api.get('/dashboard/risk-category-analysis');
    return data;
  },

  getRiskAnalysis: async (): Promise<RiskAnalysis[]> => {
    const { data } = await api.get('/dashboard/risk-analysis');
    return data;
  },

  getComplianceProgress: async (): Promise<ComplianceProgress> => {
    const { data } = await api.get('/dashboard/compliance-progress');
    return data;
  },
};

export default DashboardService; 