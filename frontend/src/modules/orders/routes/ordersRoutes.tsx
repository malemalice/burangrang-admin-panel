import { RouteConfig } from '@/core/routes/types';
import OrdersPage from '../pages/OrdersPage';
import OrderForm from '../pages/OrderForm';
import OrderDetailPage from '../pages/OrderDetailPage';

const ordersRoutes: RouteConfig[] = [
  {
    path: '/orders',
    component: OrdersPage,
    index: true,
  },
  {
    path: '/orders/new',
    component: () => <OrderForm mode="create" />,
  },
  {
    path: '/orders/:id',
    component: OrderDetailPage,
  },
  {
    path: '/orders/:id/edit',
    component: () => <OrderForm mode="edit" />,
  },
];

export default ordersRoutes;
