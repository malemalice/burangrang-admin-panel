/**
 * PPE module barrel exports
 * Following the TRD.md module structure template
 */

// Pages
export { default as PPEStockInPage } from './pages/PPEStockInPage';
export { default as PPEWithdrawPage } from './pages/PPEWithdrawPage';
export { default as CreatePPEStockPage } from './pages/stocks/CreatePPEStockPage';
export { default as PPEStockDetailPage } from './pages/stocks/PPEStockDetailPage';
export { default as EditPPEStockPage } from './pages/stocks/EditPPEStockPage';
export { default as CreatePPEWithdrawalPage } from './pages/withdrawals/CreatePPEWithdrawalPage';
export { default as PPEWithdrawalDetailPage } from './pages/withdrawals/PPEWithdrawalDetailPage';
export { default as EditPPEWithdrawalPage } from './pages/withdrawals/EditPPEWithdrawalPage';

// Routes
export { default as ppeRoutes } from './routes/ppeRoutes';

// Services
export { default as ppeService } from './services/ppeService';

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

// Hooks
export {
    usePPEStocks,
    usePPEStock,
    usePPEStockItems,
    usePPEWithdrawals,
    usePPEWithdrawal,
} from './hooks/usePPE';

