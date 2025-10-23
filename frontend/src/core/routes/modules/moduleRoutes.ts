import { RouteConfig } from '../types';
import { riskAssessmentRoutes } from '@/modules/risk-assessment';

/**
 * Module routes for operational components
 */
const moduleRoutes: RouteConfig[] = [
  ...riskAssessmentRoutes,
];

export default moduleRoutes;
