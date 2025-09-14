import { RouteConfig } from '@/core/routes/types';
import MenusPage from '../pages/MenusPage';
import CreateMenuPage from '../pages/CreateMenuPage';
import EditMenuPage from '../pages/EditMenuPage';
import MenuDetailPage from '../pages/MenuDetailPage';

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