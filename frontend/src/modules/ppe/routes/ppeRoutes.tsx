import { RouteConfig } from '@/core/routes/types';
import PPEStockInPage from '../pages/PPEStockInPage';
import PPEWithdrawPage from '../pages/PPEWithdrawPage';
import CreatePPEStockPage from '../pages/stocks/CreatePPEStockPage';
import PPEStockDetailPage from '../pages/stocks/PPEStockDetailPage';
import EditPPEStockPage from '../pages/stocks/EditPPEStockPage';
import CreatePPEWithdrawalPage from '../pages/withdrawals/CreatePPEWithdrawalPage';
import PPEWithdrawalDetailPage from '../pages/withdrawals/PPEWithdrawalDetailPage';
import EditPPEWithdrawalPage from '../pages/withdrawals/EditPPEWithdrawalPage';
import SafetyEquipmentTypesPage from '../pages/SafetyEquipmentTypesPage';
import SafetyEquipmentsPage from '../pages/SafetyEquipmentsPage';
import CreateSafetyEquipmentTypePage from '../pages/safety-equipment-types/CreateSafetyEquipmentTypePage';
import EditSafetyEquipmentTypePage from '../pages/safety-equipment-types/EditSafetyEquipmentTypePage';
import CreateSafetyEquipmentPage from '../pages/safety-equipments/CreateSafetyEquipmentPage';
import EditSafetyEquipmentPage from '../pages/safety-equipments/EditSafetyEquipmentPage';

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
        path: '/master/safety-equipments/new',
        component: CreateSafetyEquipmentPage,
    },
    {
        path: '/master/safety-equipments/:id/edit',
        component: EditSafetyEquipmentPage,
    },
];

export default ppeRoutes;

