import { RouteConfig } from '../types';
import RolesPage from '@/pages/roles/RolesPage';
import CreateRolePage from '@/pages/roles/CreateRolePage';
import EditRolePage from '@/pages/roles/EditRolePage';
import RoleDetailPage from '@/pages/roles/RoleDetailPage';

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