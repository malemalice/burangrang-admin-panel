import { RouteConfig } from '@/core/routes/types';
import CustomersPage from '../pages/CustomersPage';
import CreateCustomerPage from '../pages/CreateCustomerPage';
import EditCustomerPage from '../pages/EditCustomerPage';
import CustomerDetailPage from '../pages/CustomerDetailPage';

/**
 * Customer management module routes
 */
const customerRoutes: RouteConfig[] = [
  {
    path: '/customers',
    component: CustomersPage,
  },
  {
    path: '/customers/new',
    component: CreateCustomerPage,
  },
  {
    path: '/customers/:id',
    component: CustomerDetailPage,
  },
  {
    path: '/customers/:id/edit',
    component: EditCustomerPage,
  },
];

export default customerRoutes;
