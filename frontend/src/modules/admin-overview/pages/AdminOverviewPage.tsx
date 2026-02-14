import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/core/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import {
  GraduationCap,
  Award,
  ShieldCheck,
  FileCheck,
  Thermometer,
  Recycle,
  Clock,
} from 'lucide-react';
import adminOverviewService from '../services/adminOverviewService';
import type { AdminOverviewData } from '../types/admin-overview.types';

function getMetricColor(value: number): string {
  if (value > 10) return 'text-red-600';
  if (value > 0) return 'text-amber-600';
  return 'text-green-600';
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  isWarning = false,
  isInfo = false,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  isWarning?: boolean;
  isInfo?: boolean;
}) {
  const valueClass = isInfo
    ? 'text-foreground'
    : isWarning
      ? getMetricColor(typeof value === 'number' ? value : 0)
      : 'text-foreground';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function AdminOverviewPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => adminOverviewService.getOverviewData(),
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Admin Overview"
          subtitle="Critical metrics from non-core modules"
        />
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  if (!data) return null;

  const {
    lms,
    certificates,
    ppe,
    workPermits,
    environmental,
    wasteManagement,
    manHours,
  } = data as AdminOverviewData;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Overview"
        subtitle="Critical metrics from non-core modules"
      />

      {/* LMS */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Learning Management
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Overdue Enrollments"
            value={lms.overdueEnrollments}
            description={`From ${lms.totalEnrollments} total enrollments`}
            icon={GraduationCap}
            isWarning
          />
          <MetricCard
            title="Course Completion Rate"
            value={`${lms.courseCompletionRate}%`}
            description="Overall completion across courses"
            icon={GraduationCap}
          />
          <MetricCard
            title="Quiz Pass Rate"
            value={`${lms.quizPassRate}%`}
            description="Passing rate for quizzes"
            icon={GraduationCap}
          />
        </div>
      </div>

      {/* Certificates */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Certificates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Expiring in 30 Days"
            value={certificates.expiringIn30Days}
            description={`From ${certificates.totalActive} active certificates`}
            icon={Award}
            isWarning
          />
          <MetricCard
            title="Renewal Backlog"
            value={certificates.renewalBacklog}
            description="Pending renewal requests"
            icon={Award}
            isWarning
          />
          <MetricCard
            title="Categories"
            value={certificates.categoriesCount}
            description="Personnel vs equipment categories"
            icon={Award}
          />
        </div>
      </div>

      {/* PPE */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          PPE & Equipment
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Low Stock / Expiring"
            value={ppe.lowStockItems + ppe.expiringItems}
            description={`${ppe.lowStockItems} low stock, ${ppe.expiringItems} expiring`}
            icon={ShieldCheck}
            isWarning
          />
          <MetricCard
            title="Withdrawals Pending"
            value={ppe.withdrawalsPending}
            description="Awaiting approval"
            icon={ShieldCheck}
            isWarning
          />
          <MetricCard
            title="Top by Withdrawal"
            value={ppe.topEquipmentByWithdrawal}
            description="Most withdrawn equipment"
            icon={ShieldCheck}
          />
        </div>
      </div>

      {/* Work Permits */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Work Permits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Pending Approval"
            value={workPermits.pendingApproval}
            description={`From ${workPermits.totalActive} total permits`}
            icon={FileCheck}
            isWarning
          />
          <MetricCard
            title="Active Permits"
            value={workPermits.activePermits}
            description="Approved and not closed"
            icon={FileCheck}
          />
          <MetricCard
            title="Rejection Rate"
            value={`${workPermits.rejectionRate}%`}
            description="Permits rejected in period"
            icon={FileCheck}
          />
        </div>
      </div>

      {/* Environmental */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Environmental Measurements
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Rooms Not Measured"
            value={environmental.roomsNotMeasured}
            description={`Of ${environmental.totalRooms} total rooms`}
            icon={Thermometer}
            isWarning
          />
          <MetricCard
            title="Coverage"
            value={`${environmental.coveragePercent}%`}
            description="Rooms with recent measurements"
            icon={Thermometer}
          />
          <MetricCard
            title="Readings Recorded"
            value={environmental.avgReadingsRecorded}
            description="Total readings in period"
            icon={Thermometer}
          />
        </div>
      </div>

      {/* Waste Management */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Waste Management
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Reports Pending Review"
            value={wasteManagement.reportsPendingReview}
            description={`From ${wasteManagement.totalReports} total reports`}
            icon={Recycle}
            isWarning
          />
          <MetricCard
            title="Missing Reports"
            value={wasteManagement.missingReports}
            description="For current period"
            icon={Recycle}
            isWarning
          />
          <MetricCard
            title="Total Waste Weight"
            value={`${wasteManagement.totalWasteWeightKg.toLocaleString()} kg`}
            description="Recorded in period"
            icon={Recycle}
          />
        </div>
      </div>

      {/* Man Hours */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Man Hours
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Total Man Hours"
            value={manHours.totalManHours.toLocaleString()}
            description={manHours.currentPeriod}
            icon={Clock}
            isInfo
          />
          <MetricCard
            title="Student vs Non-Student"
            value={`${manHours.studentManHours.toLocaleString()} / ${manHours.nonStudentManHours.toLocaleString()}`}
            description="Student and non-student hours"
            icon={Clock}
          />
          <MetricCard
            title="YoY Change"
            value={`${manHours.yoyChangePercent > 0 ? '+' : ''}${manHours.yoyChangePercent}%`}
            description="Year-over-year comparison"
            icon={Clock}
          />
        </div>
      </div>
    </div>
  );
}
