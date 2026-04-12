import { lazy } from 'react';
import { RouteConfig } from '@/core/routes/types';

const AuditCriteriaPage = lazy(() => import('../pages/AuditCriteriaPage'));
const CreateAuditCriteriaPage = lazy(() => import('../pages/CreateAuditCriteriaPage'));
const EditAuditCriteriaPage = lazy(() => import('../pages/EditAuditCriteriaPage'));
const AuditCriteriaDetailPage = lazy(() => import('../pages/AuditCriteriaDetailPage'));

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
