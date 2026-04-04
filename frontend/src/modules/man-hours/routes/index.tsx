import { lazy } from 'react';
import { RouteConfig } from '@/core/routes/types';

const ManHoursPage = lazy(() => import('../pages/ManHoursPage'));
const CreateManHourPage = lazy(() => import('../pages/CreateManHourPage'));
const EditManHourPage = lazy(() => import('../pages/EditManHourPage'));
const ManHourReportPage = lazy(() => import('../pages/ManHourReportPage'));
const ViewManHourPage = lazy(() => import('../pages/ViewManHourPage'));

export const manHourRoutes: RouteConfig[] = [
  {
    path: '/man-hours',
    component: ManHoursPage,
  },
  {
    path: '/man-hours/new',
    component: CreateManHourPage,
  },
  {
    path: '/man-hours/report',
    component: ManHourReportPage,
  },
  {
    path: '/man-hours/:id/edit',
    component: EditManHourPage,
  },
  {
    path: '/man-hours/:id',
    component: ViewManHourPage,
  },
];

export default manHourRoutes;
