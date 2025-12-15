/**
 * Risk Matrix module barrel exports
 * Following the TRD.md module structure template
 */

// Pages
export { default as RiskMatricesPage } from './pages/RiskMatricesPage';
export { default as CreateRiskMatrixPage } from './pages/CreateRiskMatrixPage';
export { default as EditRiskMatrixPage } from './pages/EditRiskMatrixPage';
export { default as RiskMatrixForm } from './pages/RiskMatrixForm';

// Routes
export { default as riskMatrixRoutes } from './routes/riskMatrixRoutes';

// Services
export { default as riskMatrixService } from './services/riskMatrixService';

// Types
export type {
  RiskMatrix,
  RiskMatrixDTO,
  CreateRiskMatrixDTO,
  UpdateRiskMatrixDTO,
  RiskMatrixSearchParams,
  RiskRating,
  CalculateRiskDTO,
  RiskRatingEnum,
} from './types/risk-matrix.types';

// Hooks
export { useRiskMatrices, useRiskMatrix } from './hooks/useRiskMatrix';
