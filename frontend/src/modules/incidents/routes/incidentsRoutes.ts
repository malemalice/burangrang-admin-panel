import { RouteConfig } from '@/core/routes/types';
import IncidentsPage from '../pages/IncidentsPage';
import CreateIncidentPage from '../pages/CreateIncidentPage';
import EditIncidentPage from '../pages/EditIncidentPage';
import IncidentDetailPage from '../pages/IncidentDetailPage';

/**
 * Incidents module routes
 */
const incidentsRoutes: RouteConfig[] = [
  {
    path: '/incidents',
    component: IncidentsPage,
  },
  {
    path: '/incidents/new',
    component: CreateIncidentPage,
  },
  {
    path: '/incidents/:id/edit',
    component: EditIncidentPage,
  },
  {
    path: '/incidents/:id',
    component: IncidentDetailPage,
  },
];

export default incidentsRoutes;
