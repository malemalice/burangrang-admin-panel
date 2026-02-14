import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { ShieldAlert, LayoutDashboard, ChevronRight } from 'lucide-react';
import { useAuth } from '@/core/lib/auth';
import { usePermissions } from '@/core/hooks/usePermissions';
import { Icon } from '@/core/components/ui/icon';
import personalHomeService from '@/modules/personal-home/services/personalHomeService';
import type { PermissionName } from '@/core/lib/permissions';
import type { NeedsMyActionItem } from '@/modules/personal-home/types/personal-home.types';

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const QUICK_ACTIONS: Array<{
  label: string;
  path: string;
  icon: string;
  permission?: PermissionName;
}> = [
  { label: 'New risk assessment', path: '/risk-assessment/new', icon: 'FileCheck', permission: 'risk-assessment:create' },
  { label: 'Report incident', path: '/incidents/new', icon: 'AlertTriangle', permission: 'incident:create' },
  { label: 'Request work permit', path: '/work-permits/new', icon: 'ClipboardList', permission: 'work-permit:create' },
  { label: 'My enrollments', path: '/enrollments', icon: 'GraduationCap', permission: 'enrollment:list' },
  { label: 'Risk dashboard', path: '/dashboard/risk', icon: 'BarChart3', permission: 'risk-assessment:read' },
  { label: 'Admin overview', path: '/dashboard/admin-overview', icon: 'LayoutDashboard', permission: 'dashboard:admin-overview:read' },
];

const DASHBOARD_SHORTCUTS: Array<{
  label: string;
  path: string;
  permission?: PermissionName;
}> = [
  { label: 'Risk dashboard', path: '/dashboard/risk', permission: 'risk-assessment:read' },
  { label: 'Admin overview', path: '/dashboard/admin-overview', permission: 'dashboard:admin-overview:read' },
  { label: 'Hazard analytics', path: '/dashboard/hazard-analytics', permission: 'incident:list' },
  { label: 'Security team', path: '/dashboard/security-team', permission: 'incident:list' },
  { label: 'Incident profile', path: '/dashboard/incident-profile-analytic', permission: 'incident:list' },
  { label: 'KPI frequency rate', path: '/dashboard/kpi-frequency-rate', permission: 'incident:list' },
];

function needsActionTypeLabel(type: NeedsMyActionItem['type']): string {
  const labels: Record<string, string> = {
    work_permit_approval: 'Work permit',
    ppe_withdrawal_approval: 'PPE withdrawal',
    risk_assessment_approval: 'Risk assessment',
    enrollment_overdue: 'Enrollment',
    certificate_renewal: 'Certificate',
    reminder: 'Reminder',
  };
  return labels[type] ?? type;
}

/** Shortcut links to modules – permission-gated so we only show links the user can access. */
const MODULE_SHORTCUTS: Array<{ label: string; path: string; icon: string; permission?: PermissionName }> = [
  { label: 'Enrollments', path: '/enrollments', icon: 'GraduationCap', permission: 'enrollment:list' },
  { label: 'Certificates', path: '/certificates', icon: 'Award', permission: 'certificate:list' },
  { label: 'Reminders', path: '/reminders', icon: 'Bell', permission: 'reminder:list' },
  { label: 'Work permits', path: '/work-permits', icon: 'FileCheck', permission: 'work-permit:read' },
  { label: 'Courses', path: '/courses', icon: 'BookOpen', permission: 'course:list' },
];

const Home = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const displayName = user?.firstName?.trim() ? user.firstName : user?.email ?? 'there';

  const { data: homeData, isLoading: isLoadingHome } = useQuery({
    queryKey: ['personal-home'],
    queryFn: () => personalHomeService.getPersonalHomeData(),
  });

  const visibleQuickActions = QUICK_ACTIONS.filter(
    (a) => !a.permission || hasPermission(a.permission)
  );
  const visibleShortcuts = DASHBOARD_SHORTCUTS.filter(
    (s) => !s.permission || hasPermission(s.permission)
  );
  const visibleModuleShortcuts = MODULE_SHORTCUTS.filter(
    (s) => !s.permission || hasPermission(s.permission)
  );
  const showNeedsMyAction = true;

  const needsActionItems = homeData?.needsMyAction ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {getTimeBasedGreeting()}, {displayName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here’s what needs your attention and quick access to key areas.
        </p>
      </div>

      {visibleQuickActions.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Quick actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {visibleQuickActions.map((action) => (
              <Button key={action.path} variant="outline" className="h-auto py-4 justify-start" asChild>
                <Link to={action.path}>
                  <Icon name={action.icon as any} size={20} className="shrink-0 mr-3" />
                  <span>{action.label}</span>
                </Link>
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className={showNeedsMyAction ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}>
        {showNeedsMyAction && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                Needs my action
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingHome ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : needsActionItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No pending actions. When you have approvals or overdue items, they’ll appear here.
                </p>
              ) : (
                <ul className="space-y-3">
                  {needsActionItems.slice(0, 8).map((item) => (
                    <li key={item.id}>
                      <Link
                        to={item.link}
                        className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm">{item.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <p className="text-xs text-muted-foreground">
                              {needsActionTypeLabel(item.type)}
                              {item.dueDate != null && (
                                <> · Due {format(new Date(item.dueDate), 'MMM d, yyyy')}</>
                              )}
                            </p>
                            {item.priority != null && (
                              <Badge
                                variant={
                                  item.priority === 'high'
                                    ? 'destructive'
                                    : item.priority === 'medium'
                                      ? 'secondary'
                                      : 'outline'
                                }
                                className="text-xs"
                              >
                                {item.priority}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5" />
              Dashboards
            </CardTitle>
          </CardHeader>
          <CardContent>
            {visibleShortcuts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You don’t have access to any dashboards yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {visibleShortcuts.map((s) => (
                  <li key={s.path}>
                    <Link
                      to={s.path}
                      className="flex items-center justify-between py-2 text-sm text-primary hover:underline"
                    >
                      {s.label}
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {visibleModuleShortcuts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Shortcuts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {visibleModuleShortcuts.map((link) => (
                <Button key={link.path} variant="ghost" size="sm" asChild>
                  <Link to={link.path}>
                    <Icon name={link.icon as any} size={16} className="mr-1.5" />
                    {link.label}
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Home;
