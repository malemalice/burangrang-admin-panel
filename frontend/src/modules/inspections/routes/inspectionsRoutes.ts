import { RouteConfig } from '@/core/routes/types';
import InspectionsPage from '../pages/InspectionsPage';
import CreateInspectionPage from '../pages/CreateInspectionPage';
import EditInspectionPage from '../pages/EditInspectionPage';
import InspectionDetailPage from '../pages/InspectionDetailPage';

/**
 * Inspections module routes
 */
const inspectionsRoutes: RouteConfig[] = [
  {
    path: '/inspections',
    component: InspectionsPage,
  },
  {
    path: '/inspections/new',
    component: CreateInspectionPage,
  },
  {
    path: '/inspections/:id/edit',
    component: EditInspectionPage,
  },
  {
    path: '/inspections/:id',
    component: InspectionDetailPage,
  },
];

export default inspectionsRoutes;

