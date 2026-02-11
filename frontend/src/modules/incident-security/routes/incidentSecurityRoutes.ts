import { RouteConfig } from '@/core/routes/types';
import IncidentSecuritiesPage from '../pages/IncidentSecuritiesPage';
import CreateIncidentSecurityPage from '../pages/CreateIncidentSecurityPage';
import EditIncidentSecurityPage from '../pages/EditIncidentSecurityPage';
import IncidentSecurityDetailPage from '../pages/IncidentSecurityDetailPage';

const incidentSecurityRoutes: RouteConfig[] = [
  {
    path: '/incident-securities',
    component: IncidentSecuritiesPage,
  },
  {
    path: '/incident-securities/new',
    component: CreateIncidentSecurityPage,
  },
  {
    path: '/incident-securities/:id/edit',
    component: EditIncidentSecurityPage,
  },
  {
    path: '/incident-securities/:id',
    component: IncidentSecurityDetailPage,
  },
];

export default incidentSecurityRoutes;
