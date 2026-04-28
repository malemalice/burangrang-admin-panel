import { lazy } from 'react';
import { RouteConfig } from '@/core/routes/types';

const InspectionsPage = lazy(() => import('../pages/InspectionsPage'));
const CreateInspectionPage = lazy(() => import('../pages/CreateInspectionPage'));
const EditInspectionPage = lazy(() => import('../pages/EditInspectionPage'));
const InspectionDetailPage = lazy(() => import('../pages/InspectionDetailPage'));
const InspectionItemsPage = lazy(() => import('../inspection-items/pages/InspectionItemsPage'));
const ViewInspectionItemPage = lazy(() => import('../inspection-items/pages/ViewInspectionItemPage'));
const EditInspectionItemPage = lazy(() => import('../inspection-items/pages/EditInspectionItemPage'));

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
