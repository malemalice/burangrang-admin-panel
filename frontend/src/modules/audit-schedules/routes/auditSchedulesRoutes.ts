import { lazy } from 'react';
import { RouteConfig } from '@/core/routes/types';

const AuditSchedulesPage = lazy(() => import('../pages/AuditSchedulesPage'));
const CreateAuditSchedulePage = lazy(() => import('../pages/CreateAuditSchedulePage'));
const EditAuditSchedulePage = lazy(() => import('../pages/EditAuditSchedulePage'));
const AuditScheduleDetailPage = lazy(() => import('../pages/AuditScheduleDetailPage'));
const AuditClauseCriteriaPage = lazy(() => import('../pages/AuditClauseCriteriaPage'));
const ViewAuditCriteriaPage = lazy(() => import('../pages/ViewAuditCriteriaPage'));

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
    path: '/audit-schedules/:id/clauses/:clauseId/criteria/:criteriaId',
    component: ViewAuditCriteriaPage,
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
