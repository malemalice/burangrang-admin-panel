import { lazy } from 'react';
import { RouteConfig } from '@/core/routes/types';

const PPEStockInPage = lazy(() => import('../pages/PPEStockInPage'));
const PPEWithdrawPage = lazy(() => import('../pages/PPEWithdrawPage'));
const CreatePPEStockPage = lazy(() => import('../pages/stocks/CreatePPEStockPage'));
const PPEStockDetailPage = lazy(() => import('../pages/stocks/PPEStockDetailPage'));
const EditPPEStockPage = lazy(() => import('../pages/stocks/EditPPEStockPage'));
const CreatePPEWithdrawalPage = lazy(() => import('../pages/withdrawals/CreatePPEWithdrawalPage'));
const PPEWithdrawalDetailPage = lazy(() => import('../pages/withdrawals/PPEWithdrawalDetailPage'));
const EditPPEWithdrawalPage = lazy(() => import('../pages/withdrawals/EditPPEWithdrawalPage'));
const SafetyEquipmentTypesPage = lazy(() => import('../pages/SafetyEquipmentTypesPage'));
const SafetyEquipmentsPage = lazy(() => import('../pages/SafetyEquipmentsPage'));
const SafetyEquipmentDetailPage = lazy(() => import('../pages/safety-equipments/SafetyEquipmentDetailPage'));
const CreateSafetyEquipmentTypePage = lazy(() => import('../pages/safety-equipment-types/CreateSafetyEquipmentTypePage'));
const EditSafetyEquipmentTypePage = lazy(() => import('../pages/safety-equipment-types/EditSafetyEquipmentTypePage'));
const CreateSafetyEquipmentPage = lazy(() => import('../pages/safety-equipments/CreateSafetyEquipmentPage'));
const EditSafetyEquipmentPage = lazy(() => import('../pages/safety-equipments/EditSafetyEquipmentPage'));

const ppeRoutes: RouteConfig[] = [
    // PPE Stock routes
    {
        path: '/ppe/stocks',
        component: PPEStockInPage,
    },
    {
        path: '/ppe/stocks/new',
        component: CreatePPEStockPage,
    },
    {
        path: '/ppe/stocks/:id',
        component: PPEStockDetailPage,
    },
    {
        path: '/ppe/stocks/:id/edit',
        component: EditPPEStockPage,
    },
    // PPE Withdrawal routes
    {
        path: '/ppe/withdrawals',
        component: PPEWithdrawPage,
    },
    {
        path: '/ppe/withdrawals/new',
        component: CreatePPEWithdrawalPage,
    },
    {
        path: '/ppe/withdrawals/:id',
        component: PPEWithdrawalDetailPage,
    },
    {
        path: '/ppe/withdrawals/:id/edit',
        component: EditPPEWithdrawalPage,
    },
    // PPE Master Data routes
    {
        path: '/master/safety-equipment-types',
        component: SafetyEquipmentTypesPage,
    },
    {
        path: '/master/safety-equipment-types/new',
        component: CreateSafetyEquipmentTypePage,
    },
    {
        path: '/master/safety-equipment-types/:id/edit',
        component: EditSafetyEquipmentTypePage,
    },
    {
        path: '/master/safety-equipments',
        component: SafetyEquipmentsPage,
    },
    {
        path: '/master/safety-equipments/:id',
        component: SafetyEquipmentDetailPage,
    },
    {
        path: '/master/safety-equipments/new',
        component: CreateSafetyEquipmentPage,
    },
    {
        path: '/master/safety-equipments/:id/edit',
        component: EditSafetyEquipmentPage,
    },
];

export default ppeRoutes;
