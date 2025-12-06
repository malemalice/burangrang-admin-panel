import { RouteConfig } from '@/core/routes/types';
import WorkPermitsPage from '../pages/WorkPermitsPage';
import CreateWorkPermitPage from '../pages/CreateWorkPermitPage';
import EditWorkPermitPage from '../pages/EditWorkPermitPage';
import WorkPermitDetailPage from '../pages/WorkPermitDetailPage';

/**
 * Work Permit module routes
 */
const workPermitRoutes: RouteConfig[] = [
  {
    path: '/work-permits',
    component: WorkPermitsPage,
  },
  {
    path: '/work-permits/new',
    component: CreateWorkPermitPage,
  },
  {
    path: '/work-permits/:id',
    component: WorkPermitDetailPage,
  },
  {
    path: '/work-permits/:id/edit',
    component: EditWorkPermitPage,
  },
];

export default workPermitRoutes;
