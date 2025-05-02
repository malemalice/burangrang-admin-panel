import { RouteConfig } from '../types';
import MenusPage from '@/pages/menus/MenusPage';

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