import { RouteConfig } from '../types';
import UsersPage from '@/pages/users/UsersPage';
import CreateUserPage from '@/pages/users/CreateUserPage';
import EditUserPage from '@/pages/users/EditUserPage';
import UserDetailPage from '@/pages/users/UserDetailPage';

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