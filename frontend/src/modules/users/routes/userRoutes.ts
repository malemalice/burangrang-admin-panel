import { RouteConfig } from '@/core/routes/types';
import UsersPage from '../pages/UsersPage';
import CreateUserPage from '../pages/CreateUserPage';
import EditUserPage from '../pages/EditUserPage';
import UserDetailPage from '../pages/UserDetailPage';

/**
 * User management module routes
 */
const userRoutes: RouteConfig[] = [
  {
    path: '/users',
    component: UsersPage,
  },
  {
    path: '/users/new',
    component: CreateUserPage,
  },
  {
    path: '/users/:userId',
    component: UserDetailPage,
  },
  {
    path: '/users/:userId/edit',
    component: EditUserPage,
  },
];

export default userRoutes; 