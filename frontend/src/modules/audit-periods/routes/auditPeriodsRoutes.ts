import { lazy } from 'react';
import { RouteConfig } from '@/core/routes/types';

const AuditPeriodsPage = lazy(() => import('../pages/AuditPeriodsPage'));
const CreateAuditPeriodPage = lazy(() => import('../pages/CreateAuditPeriodPage'));
const AuditPeriodDetailPage = lazy(() => import('../pages/AuditPeriodDetailPage'));

const auditPeriodsRoutes: RouteConfig[] = [
  {
    path: '/audit-periods',
    component: AuditPeriodsPage,
  },
  {
    path: '/audit-periods/new',
    component: CreateAuditPeriodPage,
  },
  {
    path: '/audit-periods/:id',
    component: AuditPeriodDetailPage,
  },
];

export default auditPeriodsRoutes;
