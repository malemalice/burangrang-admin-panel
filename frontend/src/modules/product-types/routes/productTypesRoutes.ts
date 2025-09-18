import { RouteConfig } from '@/core/routes/types';
import ProductTypesPage from '../pages/ProductTypesPage';
import CreateProductTypePage from '../pages/CreateProductTypePage';
import EditProductTypePage from '../pages/EditProductTypePage';
import ProductTypeDetailPage from '../pages/ProductTypeDetailPage';

/**
 * Product Types management module routes
 */
const productTypesRoutes: RouteConfig[] = [
  {
    path: '/product-types',
    component: ProductTypesPage,
  },
  {
    path: '/product-types/new',
    component: CreateProductTypePage,
  },
  {
    path: '/product-types/:id',
    component: ProductTypeDetailPage,
  },
  {
    path: '/product-types/:id/edit',
    component: EditProductTypePage,
  },
];

export default productTypesRoutes;
