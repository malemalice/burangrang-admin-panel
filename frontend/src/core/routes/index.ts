import { lazy } from 'react';
import { RouteConfig } from './types';
import coreRoutes from './modules/coreRoutes';
import moduleRoutes from './modules/moduleRoutes';

const PublicHealthScreeningFillPage = lazy(
  () => import('@/modules/health-screenings/pages/PublicHealthScreeningFillPage'),
);
const PublicWorkPermitPage = lazy(
  () => import('@/modules/work-permits/pages/PublicWorkPermitPage'),
);
import { settingsRoutes } from '@/modules/settings';
import { accessLogRoutes } from '@/modules/access-logs';
import { userRoutes } from '@/modules/users';
import { roleRoutes } from '@/modules/roles';
import { masterDataRoutes } from '@/modules/master-data';
import { menuRoutes } from '@/modules/menus';
import { notificationRoutes } from '@/modules/notifications';
import { ppeRoutes } from '@/modules/ppe';
import { courseRoutes } from '@/modules/courses';
import { reminderRoutes } from '@/modules/reminders';
import { enrollmentRoutes } from '@/modules/enrollments';
import { quizRoutes } from '@/modules/quizzes';
import { healthQuizRoutes } from '@/modules/health-quiz';
import { healthScreeningRoutes } from '@/modules/health-screenings';
import certificateRoutes from '@/modules/certificates/routes/certificateRoutes';
import { riskMatrixRoutes } from '@/modules/risk-matrix';
import { manHourRoutes } from '@/modules/man-hours';
import { emailTemplateRoutes } from '@/modules/mail-templates';
import { auditCriteriaRoutes } from '@/modules/audit-criteria';
import auditSchedulesRoutes from '@/modules/audit-schedules/routes/auditSchedulesRoutes';
import auditPeriodsRoutes from '@/modules/audit-periods/routes/auditPeriodsRoutes';
import auditResultsRoutes from '@/modules/audit-results/routes/auditResultsRoutes';
import auditReportRoutes from '@/modules/audit-report/routes/auditReportRoutes';
import { kpiFrequencyRateRoutes } from '@/modules/kpi-frequency-rate';
import { kpiHseTargetRoutes } from '@/modules/kpi-hse-target';
import { incidentProfileAnalyticRoutes } from '@/modules/incident-profile-analytic';
import { hazardAnalyticsRoutes } from '@/modules/hazard-analytics';
import { securityTeamRoutes } from '@/modules/security-team';

/**
 * Application routes registry
 * All routes from different modules are registered here
 */
const routes: RouteConfig[] = [
  ...coreRoutes.filter(route => route.path !== '/login' && route.path !== '*'),
  ...userRoutes,
  ...roleRoutes,
  ...menuRoutes,
  ...masterDataRoutes,
  ...settingsRoutes,
  ...accessLogRoutes,
  ...notificationRoutes,
  ...ppeRoutes,
  ...courseRoutes,
  ...reminderRoutes,
  ...enrollmentRoutes,
  ...quizRoutes,
  ...healthQuizRoutes,
  ...healthScreeningRoutes,
  ...certificateRoutes,
  ...riskMatrixRoutes,
  ...manHourRoutes,
  ...moduleRoutes,
  ...emailTemplateRoutes,
  ...auditCriteriaRoutes,
  ...auditSchedulesRoutes,
  ...auditPeriodsRoutes,
  ...auditResultsRoutes,
  ...auditReportRoutes,
  ...kpiFrequencyRateRoutes,
  ...kpiHseTargetRoutes,
  ...incidentProfileAnalyticRoutes,
  ...hazardAnalyticsRoutes,
  ...securityTeamRoutes,
];

// Public routes that don't require authentication
export const publicRoutes: RouteConfig[] = [
  coreRoutes.find(route => route.path === '/login')!,
  coreRoutes.find(route => route.path === '/reset-password')!,
  {
    path: '/health-screenings/public/:token',
    component: PublicHealthScreeningFillPage,
  },
  {
    path: '/work-permits/public/:token',
    component: PublicWorkPermitPage,
  },
];

// Not Found route
export const notFoundRoute: RouteConfig = coreRoutes.find(route => route.path === '*')!;

export default routes; 