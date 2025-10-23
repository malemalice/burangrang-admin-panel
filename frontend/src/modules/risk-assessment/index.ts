/**
 * Risk Assessment module barrel exports
 * Following the TRD.md module structure template
 */

// Pages
export { default as RiskAssessmentsPage } from './pages/RiskAssessmentsPage';
export { default as CreateRiskAssessmentPage } from './pages/CreateRiskAssessmentPage';
export { default as EditRiskAssessmentPage } from './pages/EditRiskAssessmentPage';
export { default as RiskAssessmentDetailPage } from './pages/RiskAssessmentDetailPage';

// Components
export { default as RiskAssessmentForm } from './components/RiskAssessmentForm';

// Routes
export { default as riskAssessmentRoutes } from './routes/riskAssessmentRoutes';

// Services
export { default as riskAssessmentService } from './services/riskAssessmentService';
export type { CreateRiskAssessmentDTO, UpdateRiskAssessmentDTO } from './services/riskAssessmentService';

// Types
// Currently using types from @/core/lib/types
// export type { } from './types/risk-assessment.types';

// Hooks
// Placeholder for future hooks
// export { } from './hooks/useRiskAssessment';

