import { RouteConfig } from '@/core/routes/types';
import InspectionsPage from '../pages/InspectionsPage';
import CreateInspectionPage from '../pages/CreateInspectionPage';
import EditInspectionPage from '../pages/EditInspectionPage';
import InspectionDetailPage from '../pages/InspectionDetailPage';
import InspectionItemsPage from '../inspection-items/pages/InspectionItemsPage';
import ViewInspectionItemPage from '../inspection-items/pages/ViewInspectionItemPage';
import EditInspectionItemPage from '../inspection-items/pages/EditInspectionItemPage';

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
  // Inspection Items routes
  {
    path: '/inspections/items',
    component: InspectionItemsPage,
  },
  {
    path: '/inspections/items/:id',
    component: ViewInspectionItemPage,
  },
  {
    path: '/inspections/items/:id/edit',
    component: EditInspectionItemPage,
  },
];

export default inspectionsRoutes;

