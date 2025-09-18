import { RouteConfig } from '@/core/routes/types';
import CategoriesPage from '../pages/CategoriesPage';
import CreateCategoryPage from '../pages/CreateCategoryPage';
import EditCategoryPage from '../pages/EditCategoryPage';
import CategoryDetailPage from '../pages/CategoryDetailPage';

/**
 * Categories module routes
 */
const categoryRoutes: RouteConfig[] = [
  {
    path: '/categories',
    component: CategoriesPage,
  },
  {
    path: '/categories/new',
    component: CreateCategoryPage,
  },
  {
    path: '/categories/:id',
    component: CategoryDetailPage,
  },
  {
    path: '/categories/:id/edit',
    component: EditCategoryPage,
  },
];

export default categoryRoutes;
