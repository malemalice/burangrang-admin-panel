import { lazy } from 'react';
import { RouteConfig } from '@/core/routes/types';

const KpiHseTargetPage = lazy(() => import('../pages/KpiHseTargetPage'));
const CreateKpiHseTargetPage = lazy(() => import('../pages/CreateKpiHseTargetPage'));
const EditKpiHseTargetPage = lazy(() => import('../pages/EditKpiHseTargetPage'));

export const kpiHseTargetRoutes: RouteConfig[] = [
  {
    path: '/dashboard/kpi-hse-target',
    component: KpiHseTargetPage,
  },
  {
    path: '/dashboard/kpi-hse-target/new',
    component: CreateKpiHseTargetPage,
  },
  {
    path: '/dashboard/kpi-hse-target/:id/edit',
    component: EditKpiHseTargetPage,
  },
];

export default kpiHseTargetRoutes;
