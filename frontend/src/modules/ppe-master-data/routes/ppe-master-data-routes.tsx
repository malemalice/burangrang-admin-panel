import { RouteConfig } from '@/core/routes/types';
import SafetyEquipmentTypesPage from '../pages/SafetyEquipmentTypesPage';
import SafetyEquipmentsPage from '../pages/SafetyEquipmentsPage';
import CreateSafetyEquipmentTypePage from '../pages/safety-equipment-types/CreateSafetyEquipmentTypePage';
import EditSafetyEquipmentTypePage from '../pages/safety-equipment-types/EditSafetyEquipmentTypePage';
import CreateSafetyEquipmentPage from '../pages/safety-equipments/CreateSafetyEquipmentPage';
import EditSafetyEquipmentPage from '../pages/safety-equipments/EditSafetyEquipmentPage';

const ppeMasterDataRoutes: RouteConfig[] = [
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

export default ppeMasterDataRoutes;

