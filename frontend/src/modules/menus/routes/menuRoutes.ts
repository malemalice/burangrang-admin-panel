import { RouteConfig } from '@/core/routes/types';
import MenusPage from '../pages/MenusPage';

/**
 * Menu management module routes
 */
const menuRoutes: RouteConfig[] = [
  {
    path: '/menus',
    component: MenusPage,
  },
];

export default menuRoutes; 