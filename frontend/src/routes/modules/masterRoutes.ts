import { RouteConfig } from '../types';
import OfficesPage from '@/pages/master/OfficesPage';
import DepartmentsPage from '@/pages/master/DepartmentsPage';

/**
 * Master data module routes
 */
const masterRoutes: RouteConfig[] = [
  {
    path: '/master/offices',
    component: OfficesPage,
  },
  {
    path: '/master/departments',
    component: DepartmentsPage,
  },
];

export default masterRoutes; 