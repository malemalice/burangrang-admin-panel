import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import PageHeader from '@/core/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import {
  GraduationCap,
  Award,
  Bell,
  FileCheck,
  BookOpen,
  ChevronRight,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import personalHomeService from '../services/personalHomeService';
import type { PersonalHomeData } from '../types/personal-home.types';

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  isWarning = false,
  linkTo,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  isWarning?: boolean;
  linkTo?: string;
}) {
  const valueClass = isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-foreground';
  const content = (
    <Card className={linkTo ? 'hover:border-primary/50 transition-colors' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {linkTo && (
          <Link
            to={linkTo}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-2"
          >
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
  if (linkTo) {
    return <Link to={linkTo}>{content}</Link>;
  }
  return content;
}

export default function PersonalHomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['personal-home'],
    queryFn: () => personalHomeService.getPersonalHomeData(),
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Personal Home" subtitle="Your tasks and quick links" />
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  if (!data) return null;

  const d = data as PersonalHomeData;
  const { userGreeting, enrollments, certificates, reminders, pendingApprovals, quickLinks } = d;

  return (
    <div className="space-y-8">
      <PageHeader
        title={'Welcome, ' + userGreeting.displayName}
        subtitle={userGreeting.role ? 'Role: ' + userGreeting.role : undefined}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="My Enrollments"
          value={enrollments.inProgress}
          description={enrollments.overdue + ' overdue, ' + enrollments.total + ' total'}
          icon={GraduationCap}
          isWarning={enrollments.overdue > 0}
          linkTo="/enrollments"
        />
        <MetricCard
          title="My Certificates"
          value={certificates.expiringIn30Days}
          description={certificates.totalActive + ' active, expiring in 30 days'}
          icon={Award}
          isWarning={certificates.expiringIn30Days > 0}
          linkTo="/certificates"
        />
        <MetricCard
          title="Reminders"
          value={reminders.overdue + reminders.upcoming}
          description={reminders.overdue + ' overdue, ' + reminders.upcoming + ' upcoming'}
          icon={Bell}
          isWarning={reminders.overdue > 0}
          linkTo="/reminders"
        />
        <MetricCard
          title="Pending Approvals"
          value={pendingApprovals.count}
          description="Awaiting your action"
          icon={FileCheck}
          isWarning={pendingApprovals.count > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Upcoming and Overdue Reminders</CardTitle>
            <Link
              to="/reminders"
              className="text-sm font-medium text-primary inline-flex items-center gap-1"
            >
              All reminders <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {reminders.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Due {format(new Date(item.dueDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Badge
                    variant={item.status === 'OVERDUE' ? 'destructive' : 'secondary'}
                    className="shrink-0"
                  >
                    {item.status === 'OVERDUE' ? (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <Clock className="h-3 w-3 mr-1" />
                    )}
                    {item.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Pending Approvals</CardTitle>
            {pendingApprovals.count > 0 && (
              <Link
                to="/work-permits"
                className="text-sm font-medium text-primary inline-flex items-center gap-1"
              >
                View <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {pendingApprovals.items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No pending approvals.</p>
            ) : (
              <ul className="space-y-3">
                {pendingApprovals.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.type}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Links</h3>
        <div className="flex flex-wrap gap-2">
          {quickLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
            >
              {link.label === 'My Enrollments' && <GraduationCap className="h-4 w-4" />}
              {link.label === 'My Certificates' && <Award className="h-4 w-4" />}
              {link.label === 'Reminders' && <Bell className="h-4 w-4" />}
              {link.label === 'Work Permits' && <FileCheck className="h-4 w-4" />}
              {link.label === 'Courses' && <BookOpen className="h-4 w-4" />}
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
