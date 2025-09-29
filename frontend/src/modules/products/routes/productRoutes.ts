import { RouteConfig } from '@/core/routes/types';
import ProductsPage from '../pages/ProductsPage';
import CreateProductPage from '../pages/CreateProductPage';
import EditProductPage from '../pages/EditProductPage';
import ProductDetailPage from '../pages/ProductDetailPage';

/**
 * Product management module routes
 */
const productRoutes: RouteConfig[] = [
  {
    path: '/products',
    component: ProductsPage,
  },
  {
    path: '/products/new',
    component: CreateProductPage,
  },
  {
    path: '/products/:id',
    component: ProductDetailPage,
  },
  {
    path: '/products/:id/edit',
    component: EditProductPage,
  },
];

export default productRoutes;
