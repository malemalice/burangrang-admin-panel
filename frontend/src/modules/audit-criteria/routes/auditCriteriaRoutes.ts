import { RouteConfig } from '@/core/routes/types';
import AuditCriteriaPage from '../pages/AuditCriteriaPage';
import CreateAuditCriteriaPage from '../pages/CreateAuditCriteriaPage';
import EditAuditCriteriaPage from '../pages/EditAuditCriteriaPage';
import AuditCriteriaDetailPage from '../pages/AuditCriteriaDetailPage';

/**
 * Audit Criteria module routes
 */
const auditCriteriaRoutes: RouteConfig[] = [
  {
    path: '/audit-criteria',
    component: AuditCriteriaPage,
  },
  {
    path: '/audit-criteria/new',
    component: CreateAuditCriteriaPage,
  },
  {
    path: '/audit-criteria/:criteriaId',
    component: AuditCriteriaDetailPage,
  },
  {
    path: '/audit-criteria/:criteriaId/edit',
    component: EditAuditCriteriaPage,
  },
];

export default auditCriteriaRoutes;
