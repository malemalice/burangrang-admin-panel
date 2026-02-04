import { RouteConfig } from './types';
import coreRoutes from './modules/coreRoutes';
import moduleRoutes from './modules/moduleRoutes';
import { settingsRoutes } from '@/modules/settings';
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
import certificateRoutes from '@/modules/certificates/routes/certificateRoutes';
import { riskMatrixRoutes } from '@/modules/risk-matrix';
import { manHourRoutes } from '@/modules/man-hours';
import { emailTemplateRoutes } from '@/modules/mail-templates';
import { auditCriteriaRoutes } from '@/modules/audit-criteria';
import auditSchedulesRoutes from '@/modules/audit-schedules/routes/auditSchedulesRoutes';
import auditResultsRoutes from '@/modules/audit-results/routes/auditResultsRoutes';
import { kpiFrequencyRateRoutes } from '@/modules/kpi-frequency-rate';
import { incidentProfileAnalyticRoutes } from '@/modules/incident-profile-analytic';
import { hazardAnalyticsRoutes } from '@/modules/hazard-analytics';

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
  ...notificationRoutes,
  ...ppeRoutes,
  ...courseRoutes,
  ...reminderRoutes,
  ...enrollmentRoutes,
  ...quizRoutes,
  ...certificateRoutes,
  ...riskMatrixRoutes,
  ...manHourRoutes,
  ...moduleRoutes,
  ...emailTemplateRoutes,
  ...auditCriteriaRoutes,
  ...auditSchedulesRoutes,
  ...auditResultsRoutes,
  ...kpiFrequencyRateRoutes,
  ...incidentProfileAnalyticRoutes,
  ...hazardAnalyticsRoutes,
];

// Public routes that don't require authentication
export const publicRoutes: RouteConfig[] = [
  coreRoutes.find(route => route.path === '/login')!,
  coreRoutes.find(route => route.path === '/reset-password')!,
];

// Not Found route
export const notFoundRoute: RouteConfig = coreRoutes.find(route => route.path === '*')!;

export default routes; 