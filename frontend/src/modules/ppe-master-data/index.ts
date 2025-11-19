/**
 * PPE Master Data Module
 * Barrel export for cleaner imports
 */

// Pages
export { default as SafetyEquipmentTypesPage } from './pages/SafetyEquipmentTypesPage';
export { default as SafetyEquipmentsPage } from './pages/SafetyEquipmentsPage';
export { default as CreateSafetyEquipmentTypePage } from './pages/safety-equipment-types/CreateSafetyEquipmentTypePage';
export { default as EditSafetyEquipmentTypePage } from './pages/safety-equipment-types/EditSafetyEquipmentTypePage';
export { default as CreateSafetyEquipmentPage } from './pages/safety-equipments/CreateSafetyEquipmentPage';
export { default as EditSafetyEquipmentPage } from './pages/safety-equipments/EditSafetyEquipmentPage';

// Routes
export { default as ppeMasterDataRoutes } from './routes/ppe-master-data-routes';

// Services
export { default as safetyEquipmentTypeService } from './services/safetyEquipmentTypeService';
export { default as safetyEquipmentService } from './services/safetyEquipmentService';

// Types
export * from './types/ppe-master-data.types';

// Hooks
export * from './hooks/useSafetyEquipmentTypes';
export * from './hooks/useSafetyEquipments';

