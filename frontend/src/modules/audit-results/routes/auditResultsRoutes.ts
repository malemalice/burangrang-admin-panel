import { lazy } from 'react';
import { RouteConfig } from '@/core/routes/types';

const AuditResultsPage = lazy(() => import('../pages/AuditResultsPage'));

/**
 * Audit Results module routes
 */
const auditResultsRoutes: RouteConfig[] = [
  {
    path: '/audit-results',
    component: AuditResultsPage,
  },
];

export default auditResultsRoutes;
