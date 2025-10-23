import { RouteConfig } from '@/core/routes/types';
import RolesPage from '../pages/RolesPage';
import CreateRolePage from '../pages/CreateRolePage';
import EditRolePage from '../pages/EditRolePage';
import RoleDetailPage from '../pages/RoleDetailPage';

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