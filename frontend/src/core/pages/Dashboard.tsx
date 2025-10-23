import React from 'react';
import { useQuery } from '@tanstack/react-query';
import PageHeader from "@/core/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Progress } from "@/core/components/ui/progress";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
  ShieldAlert,
  FileCheck,
  Building2,
} from "lucide-react";
import { DashboardService } from '@/modules/master-data';
import { format } from 'date-fns';

const riskLevelColors = {
  LOW: 'bg-green-500',
  MEDIUM: 'bg-yellow-500',
  HIGH: 'bg-orange-500',
  EXTREME: 'bg-red-500',
};

const statusColors = {
  PENDING: 'text-yellow-500',
  APPROVED: 'text-green-500',
  REJECTED: 'text-red-500',
};

const Dashboard = () => {
  const { data: riskOverview, isLoading: isLoadingOverview } = useQuery({
    queryKey: ['dashboard', 'risk-overview'],
    queryFn: DashboardService.getRiskOverview,
  });

  const { data: complianceProgress, isLoading: isLoadingCompliance } = useQuery({
    queryKey: ['dashboard', 'compliance-progress'],
    queryFn: DashboardService.getComplianceProgress,
  });

  const { data: hseCategoryAnalysis, isLoading: isLoadingHse } = useQuery({
    queryKey: ['dashboard', 'hse-category-analysis'],
    queryFn: DashboardService.getHseCategoryAnalysis,
  });

  const { data: threatAnalysis, isLoading: isLoadingThreats } = useQuery({
    queryKey: ['dashboard', 'threat-analysis'],
    queryFn: DashboardService.getThreatAnalysis,
  });

  const isLoading = isLoadingOverview || isLoadingCompliance || isLoadingHse || isLoadingThreats;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const statCards = [
    {
      title: "Total Assessments",
      value: riskOverview?.totalAssessments.toString() ?? "0",
      icon: FileCheck,
      change: "Active",
      positive: true,
    },
    {
      title: "Compliance Rate",
      value: `${Math.round(complianceProgress?.complianceRate ?? 0)}%`,
      icon: CheckCircle,
      change: "Overall",
      positive: true,
    },
    {
      title: "Pending Reviews",
      value: complianceProgress?.pendingAssessments.toString() ?? "0",
      icon: Clock,
      change: "Needs Action",
      positive: false,
    },
    {
      title: "High Risk Items",
      value: ((riskOverview?.riskDistribution.HIGH || 0) + (riskOverview?.riskDistribution.EXTREME || 0)).toString(),
      icon: AlertTriangle,
      change: "Critical",
      positive: false,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Risk Assessment Dashboard" 
        subtitle="Overview of risk assessments and compliance"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className={`text-xs ${card.positive ? 'text-green-600' : 'text-amber-600'} mt-1`}>
                {card.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(riskOverview?.riskDistribution ?? {}).map(([level, count]) => (
                <div key={level} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{level}</span>
                    <span>{count}</span>
                  </div>
                  <Progress
                    value={(count / riskOverview?.totalAssessments) * 100}
                    className={`h-2 ${riskLevelColors[level as keyof typeof riskLevelColors]}`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Assessments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {riskOverview?.recentAssessments.map((assessment) => (
                <div key={assessment.id} className="flex items-center justify-between pb-4 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{assessment.code}</p>
                    <p className="text-xs text-gray-500">{assessment.department}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(assessment.assessmentDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <span className={`text-sm ${statusColors[assessment.status as keyof typeof statusColors]}`}>
                    {assessment.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HSE Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">HSE Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hseCategoryAnalysis?.map((category) => (
                <div key={category.categoryId} className="pb-4 border-b last:border-0">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-sm">{category.name}</p>
                    <span className="text-sm text-gray-500">
                      {category.totalOccurrences} items
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {Object.entries(category.riskDistribution).map(([level, count]) => (
                      count > 0 && (
                        <div
                          key={level}
                          className="text-xs px-2 py-1 rounded"
                          style={{ backgroundColor: riskLevelColors[level as keyof typeof riskLevelColors] }}
                        >
                          {level}: {count}
                        </div>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Department Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Department Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {complianceProgress?.departmentCompliance.map((dept) => (
                <div key={dept.departmentId} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{dept.name}</span>
                    <span>{Math.round(dept.complianceRate)}%</span>
                  </div>
                  <Progress
                    value={dept.complianceRate}
                    className="h-2"
                    indicatorClassName={dept.complianceRate >= 70 ? 'bg-green-500' : 'bg-amber-500'}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Threat Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Critical Threats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {threatAnalysis?.filter(threat => 
              ['HIGH', 'EXTREME'].includes(threat.averageRiskRating)
            ).map((threat) => (
              <div
                key={threat.threatId}
                className="p-4 rounded-lg border"
              >
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className={`h-5 w-5 ${
                    threat.averageRiskRating === 'EXTREME' ? 'text-red-500' : 'text-orange-500'
                  }`} />
                  <h3 className="font-medium text-sm">{threat.name}</h3>
                </div>
                <p className="text-xs text-gray-500 mb-2">{threat.category}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {threat.occurrences} occurrences
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    riskLevelColors[threat.averageRiskRating]
                  }`}>
                    {threat.averageRiskRating}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
