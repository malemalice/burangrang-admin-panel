import { lazy } from 'react';
import { RouteConfig } from '@/core/routes/types';

const UsersPage = lazy(() => import('../pages/UsersPage'));
const CreateUserPage = lazy(() => import('../pages/CreateUserPage'));
const EditUserPage = lazy(() => import('../pages/EditUserPage'));
const UserDetailPage = lazy(() => import('../pages/UserDetailPage'));

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
