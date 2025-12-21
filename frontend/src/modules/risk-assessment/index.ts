/**
 * Risk Assessment Module
 * 
 * This module handles risk assessment recording and management,
 * including creation, editing, and tracking of risk assessments
 * with associated risk items and ratings.
 */

export * from './pages';
export { default as RiskAssessmentForm } from './components/RiskAssessmentForm';
export { default as riskAssessmentService } from './services/riskAssessmentService';
export type { CreateRiskAssessmentDTO, UpdateRiskAssessmentDTO } from './services/riskAssessmentService';
export { default as riskAssessmentRoutes } from './routes/riskAssessmentRoutes';

