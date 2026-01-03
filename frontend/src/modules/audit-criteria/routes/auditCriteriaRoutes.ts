import { RouteConfig } from '@/core/routes/types';
import AuditCriteriaPage from '../pages/AuditCriteriaPage';

/**
 * Audit Criteria module routes
 */
const auditCriteriaRoutes: RouteConfig[] = [
  {
    path: '/audit-criteria',
    component: AuditCriteriaPage,
  },
];

export default auditCriteriaRoutes;
