import { RouteConfig } from '@/core/routes/types';
import WorkPermitsPage from '../pages/WorkPermitsPage';
import CreateWorkPermitPage from '../pages/CreateWorkPermitPage';
import EditWorkPermitPage from '../pages/EditWorkPermitPage';
import WorkPermitDetailPage from '../pages/WorkPermitDetailPage';
import WorkClassificationsPage from '../pages/WorkClassificationsPage';
import CreateWorkClassificationPage from '../pages/CreateWorkClassificationPage';
import EditWorkClassificationPage from '../pages/EditWorkClassificationPage';
import WorkClassificationDetailPage from '../pages/WorkClassificationDetailPage';
import WorkPermitWorkersPage from '../pages/WorkPermitWorkersPage';
import CreateWorkPermitWorkerPage from '../pages/CreateWorkPermitWorkerPage';
import WorkPermitWorkerDetailPage from '../pages/WorkPermitWorkerDetailPage';

/**
 * Work Permit module routes
 */
const workPermitRoutes: RouteConfig[] = [
  {
    path: '/work-permits',
    component: WorkPermitsPage,
  },
  {
    path: '/work-permits/workers/new',
    component: CreateWorkPermitWorkerPage,
  },
  {
    path: '/work-permits/workers/:userId',
    component: WorkPermitWorkerDetailPage,
  },
  {
    path: '/work-permits/workers',
    component: WorkPermitWorkersPage,
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
  {
    path: '/master/work-classifications/new',
    component: CreateWorkClassificationPage,
  },
  {
    path: '/master/work-classifications/:id/edit',
    component: EditWorkClassificationPage,
  },
  {
    path: '/master/work-classifications/:id',
    component: WorkClassificationDetailPage,
  },
  {
    path: '/master/work-classifications',
    component: WorkClassificationsPage,
  },
];

export default workPermitRoutes;
