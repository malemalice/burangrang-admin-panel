import { lazy } from 'react';
import { RouteConfig } from '@/core/routes/types';

const RolesPage = lazy(() => import('../pages/RolesPage'));
const CreateRolePage = lazy(() => import('../pages/CreateRolePage'));
const EditRolePage = lazy(() => import('../pages/EditRolePage'));
const RoleDetailPage = lazy(() => import('../pages/RoleDetailPage'));

/**
 * Role management module routes
 */
const roleRoutes: RouteConfig[] = [
  {
    path: '/roles',
    component: RolesPage,
  },
  {
    path: '/roles/new',
    component: CreateRolePage,
  },
  {
    path: '/roles/:roleId',
    component: RoleDetailPage,
  },
  {
    path: '/roles/:roleId/edit',
    component: EditRolePage,
  },
];

export default roleRoutes;
