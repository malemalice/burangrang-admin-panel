import { RouteConfig } from '@/core/routes/types';
import AuditResultsPage from '../pages/AuditResultsPage';

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
