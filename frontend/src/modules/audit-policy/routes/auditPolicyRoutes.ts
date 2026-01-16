import { RouteConfig } from '@/core/routes/types';
import AuditPolicyPage from '../pages/AuditPolicyPage';
import AuditPolicyDetailPage from '../pages/AuditPolicyDetailPage';
import CreateAuditElementPage from '../pages/CreateAuditElementPage';
import EditAuditElementPage from '../pages/EditAuditElementPage';

/**
 * Audit Policy module routes
 */
const auditPolicyRoutes: RouteConfig[] = [
  {
    path: '/audit-policy',
    component: AuditPolicyPage,
  },
  {
    path: '/audit-policy/new',
    component: CreateAuditElementPage,
  },
  {
    path: '/audit-policy/:id/edit',
    component: EditAuditElementPage,
  },
  {
    path: '/audit-policy/:id',
    component: AuditPolicyDetailPage,
  },
];

export default auditPolicyRoutes;