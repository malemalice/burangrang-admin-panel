import { RouteConfig } from '@/core/routes/types';
import InspectionsPage from '../pages/InspectionsPage';
import CreateInspectionPage from '../pages/CreateInspectionPage';
import EditInspectionPage from '../pages/EditInspectionPage';

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
];

export default inspectionsRoutes;

