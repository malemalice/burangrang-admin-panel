import { lazy } from 'react';
import { RouteConfig } from '@/core/routes/types';

const MenusPage = lazy(() => import('../pages/MenusPage'));
const CreateMenuPage = lazy(() => import('../pages/CreateMenuPage'));
const EditMenuPage = lazy(() => import('../pages/EditMenuPage'));
const MenuDetailPage = lazy(() => import('../pages/MenuDetailPage'));

/**
 * Menu management module routes
 */
const menuRoutes: RouteConfig[] = [
  {
    path: '/menus',
    component: MenusPage,
  },
  {
    path: '/menus/new',
    component: CreateMenuPage,
  },
  {
    path: '/menus/:id',
    component: MenuDetailPage,
  },
  {
    path: '/menus/:id/edit',
    component: EditMenuPage,
  },
];

export default menuRoutes;
