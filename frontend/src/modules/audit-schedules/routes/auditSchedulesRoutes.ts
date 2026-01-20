import { RouteConfig } from '@/core/routes/types';
import AuditSchedulesPage from '../pages/AuditSchedulesPage';
import CreateAuditSchedulePage from '../pages/CreateAuditSchedulePage';
import EditAuditSchedulePage from '../pages/EditAuditSchedulePage';
import AuditScheduleDetailPage from '../pages/AuditScheduleDetailPage';
import AuditClauseCriteriaPage from '../pages/AuditClauseCriteriaPage';

/**
 * Audit Schedules module routes
 */
const auditSchedulesRoutes: RouteConfig[] = [
  {
    path: '/audit-schedules',
    component: AuditSchedulesPage,
  },
  {
    path: '/audit-schedules/new',
    component: CreateAuditSchedulePage,
  },
  {
    path: '/audit-schedules/:id/edit',
    component: EditAuditSchedulePage,
  },
  {
    path: '/audit-schedules/:id/clauses/:clauseId',
    component: AuditClauseCriteriaPage,
  },
  {
    path: '/audit-schedules/:id',
    component: AuditScheduleDetailPage,
  },
];

export default auditSchedulesRoutes;
