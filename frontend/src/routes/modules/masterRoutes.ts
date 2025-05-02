import { RouteConfig } from '../types';
import OfficesPage from '@/pages/master/OfficesPage';
import CreateOfficePage from '@/pages/master/CreateOfficePage';
import EditOfficePage from '@/pages/master/EditOfficePage';
import OfficeDetailPage from '@/pages/master/OfficeDetailPage';
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
    path: '/master/offices/new',
    component: CreateOfficePage,
  },
  {
    path: '/master/offices/:id',
    component: OfficeDetailPage,
  },
  {
    path: '/master/offices/:id/edit',
    component: EditOfficePage,
  },
  {
    path: '/master/departments',
    component: DepartmentsPage,
  },
];

export default masterRoutes; 