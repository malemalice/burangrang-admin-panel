import { lazy } from 'react';
import { RouteConfig } from '@/core/routes/types';

const AuditReportPage = lazy(() => import('../pages/AuditReportPage'));

const auditReportRoutes: RouteConfig[] = [
  {
    path: '/audit-report',
    component: AuditReportPage,
  },
];

export default auditReportRoutes;
