/**
 * PPE module barrel exports
 * Following the TRD.md module structure template
 */

// Pages - PPE Stock & Withdrawal
export { default as PPEStockInPage } from './pages/PPEStockInPage';
export { default as PPEWithdrawPage } from './pages/PPEWithdrawPage';
export { default as CreatePPEStockPage } from './pages/stocks/CreatePPEStockPage';
export { default as PPEStockDetailPage } from './pages/stocks/PPEStockDetailPage';
export { default as EditPPEStockPage } from './pages/stocks/EditPPEStockPage';
export { default as CreatePPEWithdrawalPage } from './pages/withdrawals/CreatePPEWithdrawalPage';
export { default as PPEWithdrawalDetailPage } from './pages/withdrawals/PPEWithdrawalDetailPage';
export { default as EditPPEWithdrawalPage } from './pages/withdrawals/EditPPEWithdrawalPage';

// Pages - PPE Master Data
export { default as SafetyEquipmentTypesPage } from './pages/SafetyEquipmentTypesPage';
export { default as SafetyEquipmentsPage } from './pages/SafetyEquipmentsPage';
export { default as CreateSafetyEquipmentTypePage } from './pages/safety-equipment-types/CreateSafetyEquipmentTypePage';
export { default as EditSafetyEquipmentTypePage } from './pages/safety-equipment-types/EditSafetyEquipmentTypePage';
export { default as CreateSafetyEquipmentPage } from './pages/safety-equipments/CreateSafetyEquipmentPage';
export { default as EditSafetyEquipmentPage } from './pages/safety-equipments/EditSafetyEquipmentPage';

// Routes
export { default as ppeRoutes } from './routes/ppeRoutes';

// Services
export { default as ppeService } from './services/ppeService';
export { default as safetyEquipmentTypeService } from './services/safetyEquipmentTypeService';
export { default as safetyEquipmentService } from './services/safetyEquipmentService';

// Types
export type {
    PPEStock,
    PPEStockDTO,
    PPEStockItem,
    PPEStockItemDTO,
    PPEWithdrawal,
    PPEWithdrawalDTO,
    PPEWithdrawalItem,
    PPEWithdrawalItemDTO,
    CreatePPEStockDTO,
    UpdatePPEStockDTO,
    CreatePPEWithdrawalDTO,
    UpdatePPEWithdrawalDTO,
    CreateStockAdjustmentDTO,
    PPEStockStatus,
    PPEWithdrawalStatus,
    AdjustmentType,
    PPEStockSearchParams,
    PPEStockItemSearchParams,
    PPEWithdrawalSearchParams,
} from './types/ppe.types';

export * from './types/ppe-master-data.types';

// Hooks
export {
    usePPEStocks,
    usePPEStock,
    usePPEStockItems,
    usePPEWithdrawals,
    usePPEWithdrawal,
} from './hooks/usePPE';

export * from './hooks/useSafetyEquipmentTypes';
export * from './hooks/useSafetyEquipments';

