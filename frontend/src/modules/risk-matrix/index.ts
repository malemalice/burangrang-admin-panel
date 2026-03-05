/**
 * Risk Matrix module barrel exports
 * Following the TRD.md module structure template
 */

// Pages
export { default as RiskMatrixViewPage } from './pages/RiskMatrixViewPage';
export { default as RiskMatrixManagementPage } from './pages/RiskMatrixManagementPage';
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
  // Likelihood & Consequence UI types (extracted from RiskMatrix)
  LikelihoodOption,
  ConsequenceOption,
  // Risk Matrix types
  RiskMatrix,
  RiskMatrixDTO,
  CreateRiskMatrixDTO,
  UpdateRiskMatrixDTO,
  RiskMatrixSearchParams,
  RiskRating,
  CalculateRiskDTO,
  RiskRatingEnum,
  MatrixCell,
} from './types/risk-matrix.types';

// Hooks
export { useRiskMatrices, useRiskMatrix } from './hooks/useRiskMatrix';
